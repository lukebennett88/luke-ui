import { Project, SyntaxKind } from 'ts-morph';
import type {
	ExpressionWithTypeArguments,
	FunctionDeclaration,
	InterfaceDeclaration,
	Node,
	PropertySignature,
	SourceFile,
	TypeAliasDeclaration,
} from 'ts-morph';
import type { ExportTier } from './discover-exports.js';

export interface ParsedProp {
	name: string;
	type: string;
	optional: boolean;
	default?: string;
	description: string;
}

export interface ParsedExtends {
	from: 'package' | 'external';
	module?: string;
	typeName: string;
}

export interface ParsedComponent {
	description: string;
	tier?: ExportTier;
	propsInterface?: {
		name: string;
		extends: Array<ParsedExtends>;
		members: Array<ParsedProp>;
	};
}

const TIER_VALUES: ReadonlyArray<ExportTier> = ['atom', 'composed', 'primitive'];

export function parseComponent(sourcePath: string): ParsedComponent {
	const project = new Project({
		tsConfigFilePath: undefined,
		skipAddingFilesFromTsConfig: true,
		compilerOptions: { allowJs: false, jsx: 4 /* React */ },
	});
	const sourceFile = project.addSourceFileAtPath(sourcePath);

	const exportedFn =
		sourceFile.getFunctions().find((f) => f.isExported() && f.getJsDocs().length > 0) ??
		sourceFile.getFunctions().find((f) => f.isExported());

	const description = exportedFn?.getJsDocs()[0]?.getDescription().trim() ?? '';

	const propsInterface = sourceFile
		.getInterfaces()
		.find((i) => i.isExported() && i.getName().endsWith('Props'));

	if (!propsInterface) {
		return { description };
	}

	const tier = readTierTag(propsInterface);
	const extendsList = readExtends(propsInterface);
	const members = collectMembers(propsInterface);

	return {
		description,
		tier,
		propsInterface: {
			name: propsInterface.getName(),
			extends: extendsList,
			members,
		},
	};
}

function readTierTag(decl: InterfaceDeclaration): ExportTier | undefined {
	for (const jsDoc of decl.getJsDocs()) {
		for (const tag of jsDoc.getTags()) {
			if (tag.getTagName() === 'tier') {
				const value = tag.getCommentText()?.trim().toLowerCase();
				if (value && (TIER_VALUES as ReadonlyArray<string>).includes(value)) {
					return value as ExportTier;
				}
			}
		}
	}
	return undefined;
}

function moduleFromPath(filePath: string): string | undefined {
	const segments = filePath.split('/node_modules/');
	const lastSegment = segments[segments.length - 1];
	if (!lastSegment) return undefined;
	return lastSegment.startsWith('@')
		? lastSegment.split('/').slice(0, 2).join('/')
		: lastSegment.split('/')[0];
}

/** True when a path points to TypeScript's own built-in lib files (e.g. lib.es5.d.ts). */
function isTsBuiltinPath(filePath: string): boolean {
	return filePath.includes('/node_modules/typescript/lib/');
}

/**
 * Resolve the external module info from a heritage clause's type arguments.
 * Used when the expression itself is a TypeScript utility type (Omit, Pick, etc.)
 * that resolves to TypeScript's own lib rather than a user package.
 */
function resolveExternalFromTypeArgs(
	heritage: ExpressionWithTypeArguments,
): { module: string | undefined; typeName: string } | undefined {
	for (const typeArg of heritage.getTypeArguments()) {
		const argType = typeArg.getType();
		const argSym = argType.getSymbol() ?? argType.getAliasSymbol();
		const argDecls = argSym?.getDeclarations() ?? [];
		for (const argDecl of argDecls) {
			const argPath = argDecl.getSourceFile().getFilePath();
			if (argPath.includes('/node_modules/') && !isTsBuiltinPath(argPath)) {
				return {
					module: moduleFromPath(argPath),
					typeName: argSym?.getName() ?? typeArg.getText(),
				};
			}
		}
	}
	return undefined;
}

function readExtends(decl: InterfaceDeclaration): Array<ParsedExtends> {
	const result: Array<ParsedExtends> = [];
	for (const heritage of decl.getExtends()) {
		const expr = heritage.getExpression();
		const typeName = expr.getText();
		const symbol = expr.getSymbol();
		const declarations = symbol?.getDeclarations() ?? [];

		if (declarations.length > 0) {
			const firstDecl = declarations[0];
			const sourceFilePath = firstDecl?.getSourceFile().getFilePath() ?? '';

			if (sourceFilePath.includes('/node_modules/') && !isTsBuiltinPath(sourceFilePath)) {
				// Direct external reference (e.g. SomeExternalInterface)
				result.push({ from: 'external', module: moduleFromPath(sourceFilePath), typeName });
				continue;
			}

			if (isTsBuiltinPath(sourceFilePath)) {
				// TypeScript utility type (Omit, Pick, etc.) — look at type args for the real external dep
				const resolved = resolveExternalFromTypeArgs(heritage);
				if (resolved) {
					result.push({ from: 'external', module: resolved.module, typeName: resolved.typeName });
				}
				// Skip if the utility type only wraps local types
				continue;
			}

			// Local package type
			result.push({ from: 'package', typeName });
			continue;
		}

		// No declarations — check type arguments for external references
		const resolved = resolveExternalFromTypeArgs(heritage);
		if (resolved) {
			result.push({ from: 'external', module: resolved.module, typeName: resolved.typeName });
		} else {
			result.push({ from: 'external', typeName });
		}
	}
	return result;
}

function collectMembers(decl: InterfaceDeclaration): Array<ParsedProp> {
	const out: Array<ParsedProp> = [];
	for (const prop of decl.getProperties()) {
		out.push(toParsedProp(prop));
	}
	for (const heritage of decl.getExtends()) {
		const expr = heritage.getExpression();
		const symbol = expr.getSymbol();
		const target = symbol
			?.getDeclarations()
			.find((d) => d.getKind() === SyntaxKind.InterfaceDeclaration);
		if (target && !target.getSourceFile().getFilePath().includes('/node_modules/')) {
			for (const prop of (target as InterfaceDeclaration).getProperties()) {
				if (out.some((m) => m.name === prop.getName())) continue;
				out.push(toParsedProp(prop));
			}
		}
	}
	return out;
}

function toParsedProp(prop: PropertySignature): ParsedProp {
	const jsDoc = prop.getJsDocs()[0];
	const description = jsDoc?.getDescription().trim() ?? '';
	let defaultValue: string | undefined;
	for (const tag of jsDoc?.getTags() ?? []) {
		if (tag.getTagName() === 'default') {
			defaultValue = tag.getCommentText()?.trim();
		}
	}
	return {
		name: prop.getName(),
		type: resolvePropType(prop),
		optional: prop.hasQuestionToken(),
		default: defaultValue,
		description,
	};
}

/**
 * For indexed-access types (e.g. `Foo['bar']`) the AST text is opaque,
 * so resolve to the literal underlying type. For direct unions or primitives
 * the AST text already reads cleanly and preserves the author's quote style.
 *
 * If the resolved type is unwieldy (e.g. a React `children` union), fall back
 * to the AST text so the docs table stays readable.
 */
function resolvePropType(prop: PropertySignature): string {
	const node = prop.getTypeNode();
	const astText = node?.getText() ?? prop.getType().getText(prop);
	if (node?.getKind() !== SyntaxKind.IndexedAccessType) return astText;
	const resolved = stripImportPaths(prop.getType().getNonNullableType().getText(prop));
	return resolved.length > UNWIELDY_TYPE_THRESHOLD ? astText : resolved;
}

const UNWIELDY_TYPE_THRESHOLD = 100;

/** Strip `import("specifier").` qualifiers TypeScript inserts when a type is not in scope. */
function stripImportPaths(type: string): string {
	return type.replace(/import\("[^"]+"\)\./g, '');
}

// ---------------------------------------------------------------------------
// Barrel parser
// ---------------------------------------------------------------------------

export interface ParsedBarrelExport {
	name: string;
	description: string;
	type?: string;
}

export interface ParsedBarrel {
	description: string;
	exports: Array<ParsedBarrelExport>;
}

/**
 * Walk a source file's top-level exports and return their names, JSDoc
 * descriptions, and (when compact) type signatures.
 */
export function parseBarrel(sourcePath: string): ParsedBarrel {
	const project = new Project({
		tsConfigFilePath: undefined,
		skipAddingFilesFromTsConfig: true,
		compilerOptions: { allowJs: false, jsx: 4 /* React */ },
	});
	const sourceFile = project.addSourceFileAtPath(sourcePath);

	// File-level JSDoc: ts-morph does not expose getJsDocs() on SourceFile.
	// The file-level doc block appears as a leading comment on the first statement.
	const description = readFileLevelJsDoc(sourceFile);

	// Build a map from export name → JSDoc description extracted from the
	// re-export statement's leading comment. Used as a fallback when the resolved
	// declaration (possibly in another file) carries no JSDoc of its own.
	const reExportDescriptions = buildReExportDescriptionMap(sourceFile);

	// Collect all exported declarations keyed by name.
	const exportedDecls = sourceFile.getExportedDeclarations();

	const exports: Array<ParsedBarrelExport> = [];

	for (const [name, decls] of exportedDecls.entries()) {
		// Skip type-only exports (Props interfaces, etc.) — they only appear as
		// companions to their runtime counterpart and we list them in the type
		// field there.  Heuristic: names ending with "Props" or "Size" that are
		// pure interfaces / type aliases.
		const firstDecl = decls[0];
		if (!firstDecl) continue;

		const kind = firstDecl.getKind();

		// Skip pure type exports (interfaces/type aliases) when they are clearly
		// companion types (ends with Props, or is a type alias referencing a single type).
		if (kind === SyntaxKind.InterfaceDeclaration || kind === SyntaxKind.TypeAliasDeclaration) {
			// Only include if it has a non-trivial standalone description.
			const jsDoc = getJsDoc(firstDecl);
			const declDesc = jsDoc?.getDescription().trim() ?? '';
			const desc = declDesc || (reExportDescriptions.get(name) ?? '');
			// Include type aliases that look like standalone public types (e.g.
			// ComboboxSize) — they have short names not ending in Props.
			if (name.endsWith('Props') || !desc) continue;
			// For type aliases with descriptions, include them briefly.
			exports.push({ name, description: desc, type: getTypeSignature(firstDecl, name) });
			continue;
		}

		// Runtime export (function, class, arrow function, etc.)
		const jsDoc = getJsDoc(firstDecl);
		const declDesc = jsDoc?.getDescription().trim() ?? '';
		// Fall back to the re-export line JSDoc if the resolved declaration has none.
		const desc = declDesc || (reExportDescriptions.get(name) ?? '');
		const type = getTypeSignature(firstDecl, name);
		exports.push({ name, description: desc, type });
	}

	// Sort alphabetically for stable output.
	exports.sort((a, b) => a.name.localeCompare(b.name));

	return { description, exports };
}

/**
 * Build a map from export name → JSDoc description extracted from the leading
 * `/** ... *​/` comment on each `export { ... } from '...'` statement.
 *
 * ts-morph's `getExportedDeclarations()` resolves re-exports to the original
 * declaration site, which may be in a different file and may carry no JSDoc.
 * This function captures the JSDoc authored on the re-export line itself so it
 * can serve as a fallback description.
 */
function buildReExportDescriptionMap(sourceFile: SourceFile): Map<string, string> {
	const map = new Map<string, string>();
	for (const exportDecl of sourceFile.getExportDeclarations()) {
		const ranges = exportDecl.getLeadingCommentRanges();
		if (ranges.length === 0) continue;
		// The last leading range is the one immediately before the declaration.
		const lastRange = ranges[ranges.length - 1];
		if (!lastRange || !lastRange.getText().startsWith('/**')) continue;
		const desc = lastRange
			.getText()
			.replace(/^\/\*\*/, '')
			.replace(/\*\/$/, '')
			.split('\n')
			.map((line) => line.replace(/^\s*\*\s?/, ''))
			.join('\n')
			.trim();
		if (!desc) continue;
		// Apply this description to every named export specifier in this declaration.
		for (const specifier of exportDecl.getNamedExports()) {
			// Use the aliased name (e.g. `spinner as loadingSpinner` → `loadingSpinner`)
			const exportedName = specifier.getAliasNode()?.getText() ?? specifier.getName();
			map.set(exportedName, desc);
		}
	}
	return map;
}

/**
 * Read the file-level JSDoc block from a source file.
 * ts-morph does not expose `getJsDocs()` on `SourceFile`. The block appears
 * as the *first* leading comment on the first statement.
 *
 * When the first statement also has its own JSDoc (e.g. `/** Allowed… *\/`),
 * that appears as a second leading comment range. We only want range[0].
 */
function readFileLevelJsDoc(sourceFile: SourceFile): string {
	const stmts = sourceFile.getStatements();
	const first = stmts[0];
	if (!first) return '';
	const ranges = first.getLeadingCommentRanges();
	// There may be multiple JSDoc blocks. A file-level block is distinguished
	// by being the first one AND being separated from the statement by a blank
	// line (i.e. the following range is the statement's own JSDoc).
	// Heuristic: if there are 2+ ranges, the first is file-level.
	// If only 1 range, it belongs to the statement itself (no file-level doc).
	if (ranges.length < 2) return '';
	const jsDocRange = ranges[0];
	if (!jsDocRange || !jsDocRange.getText().startsWith('/**')) return '';
	// Strip /** ... */ markers and leading * on each line.
	const raw = jsDocRange.getText();
	return raw
		.replace(/^\/\*\*/, '')
		.replace(/\*\/$/, '')
		.split('\n')
		.map((line) => line.replace(/^\s*\*\s?/, ''))
		.join('\n')
		.trim();
}

/** Return the JSDoc attached to a node, if any. */
function getJsDoc(node: Node) {
	// ts-morph exposes getJsDocs() on many node types via mixin.
	type JsDocHost = { getJsDocs?: () => Array<{ getDescription(): string }> };
	const tryGet = (n: unknown) => {
		const host = n as JsDocHost;
		return typeof host.getJsDocs === 'function' ? (host.getJsDocs()[0] ?? null) : null;
	};
	// VariableDeclaration nodes don't carry JsDocs — they live on the parent
	// VariableStatement. Walk up one level to find them.
	if (node.getKind() === SyntaxKind.VariableDeclaration) {
		const parent = node.getParent(); // VariableDeclarationList
		const grandParent = parent?.getParent(); // VariableStatement
		const doc = grandParent ? tryGet(grandParent) : null;
		if (doc) return doc;
	}
	return tryGet(node);
}

/**
 * Produce a short, readable type signature for the node.
 * Returns undefined when the signature would be too verbose.
 */
function getTypeSignature(node: Node, name: string): string | undefined {
	const kind = node.getKind();

	if (kind === SyntaxKind.FunctionDeclaration) {
		const fn = node as FunctionDeclaration;
		const params = fn
			.getParameters()
			.map((p) => `${p.getName()}: ${p.getType().getText(p)}`)
			.join(', ');
		const returnType = fn.getReturnType().getText(fn);
		// Skip massive return types.
		if (returnType.length > 80) return undefined;
		const cleanParams = stripImportPaths(params);
		const cleanReturn = stripImportPaths(returnType);
		return `function ${name}(${cleanParams}): ${cleanReturn}`;
	}

	if (kind === SyntaxKind.TypeAliasDeclaration) {
		const alias = node as TypeAliasDeclaration;
		const text = alias.getTypeNode()?.getText() ?? '';
		// Skip large union types.
		if (text.length > 120) return undefined;
		return `type ${name} = ${text}`;
	}

	return undefined;
}
