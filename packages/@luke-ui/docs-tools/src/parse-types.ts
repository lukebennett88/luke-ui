import type {
	ExpressionWithTypeArguments,
	FunctionDeclaration,
	InterfaceDeclaration,
	PropertySignature,
	SourceFile,
	TypeAliasDeclaration,
	TypeNode,
} from 'ts-morph';
import { Node, Project, SyntaxKind } from 'ts-morph';
import type { ExportTier } from './discover-exports.js';

export interface ParsedProp {
	default?: string;
	description: string;
	name: string;
	optional: boolean;
	type: string;
}

export interface ParsedExtends {
	from: 'package' | 'external';
	module?: string;
	typeName: string;
}

export interface ParsedComponent {
	/** Name of the exported function (e.g. `'TextInput'`), if one was found. */
	componentName?: string;
	description: string;
	propsInterface?: {
		name: string;
		extends: Array<ParsedExtends>;
		members: Array<ParsedProp>;
	};
	tier?: ExportTier;
}

type PropsDeclaration = InterfaceDeclaration | TypeAliasDeclaration;
interface PropsLookup {
	all: Array<PropsDeclaration>;
	byName: Map<string, PropsDeclaration>;
}

/**
 * Build a fresh ts-morph `Project` configured for parsing a single source file
 * in isolation: no tsconfig, no implicit file discovery, JSX enabled.
 */
function createProject(): Project {
	return new Project({
		compilerOptions: { allowJs: false, jsx: 4 /* React */ },
		skipAddingFilesFromTsConfig: true,
		tsConfigFilePath: undefined,
	});
}

const project = createProject();

function getSourceFile(sourcePath: string): SourceFile {
	return project.getSourceFile(sourcePath) ?? project.addSourceFileAtPath(sourcePath);
}

export function parseComponent(sourcePath: string): ParsedComponent {
	const sourceFile = getSourceFile(sourcePath);
	const propsLookup = createPropsLookup(sourceFile);

	const exportedFns = sourceFile.getFunctions();
	let exportedFn: FunctionDeclaration | undefined;
	let documentedExportedFn: FunctionDeclaration | undefined;
	for (const fn of exportedFns) {
		if (!fn.isExported()) continue;
		if (documentedExportedFn === undefined && fn.getJsDocs().length > 0) {
			documentedExportedFn = fn;
		}
		const name = fn.getName();
		if (!name) continue;
		const props = propsLookup.byName.get(`${name}Props`);
		if (props && readTierTag(props) !== undefined) {
			exportedFn = fn;
			break;
		}
	}
	exportedFn ??= documentedExportedFn;

	const description = exportedFn?.getJsDocs()[0]?.getDescription().trim() ?? '';
	const componentName = exportedFn?.getName();

	const propsInterface = findPropsDeclaration(propsLookup, componentName);

	if (!propsInterface) {
		return { componentName, description };
	}

	const tier = readTierTag(propsInterface);
	const extendsList = Node.isInterfaceDeclaration(propsInterface)
		? readExtends(propsInterface)
		: [];
	const members = collectMembers(propsInterface);

	return {
		componentName,
		description,
		propsInterface: {
			extends: extendsList,
			members,
			name: propsInterface.getName(),
		},
		tier,
	};
}

function createPropsLookup(sourceFile: SourceFile): PropsLookup {
	const all: Array<PropsDeclaration> = [];
	const byName = new Map<string, PropsDeclaration>();
	appendPropsDeclarations(sourceFile.getInterfaces(), all, byName);
	appendPropsDeclarations(sourceFile.getTypeAliases(), all, byName);
	return { all, byName };
}

function appendPropsDeclarations(
	declarations: Array<PropsDeclaration>,
	all: Array<PropsDeclaration>,
	byName: Map<string, PropsDeclaration>,
): void {
	for (let i = 0; i < declarations.length; i++) {
		const decl = declarations[i];
		if (!decl?.isExported()) continue;

		const name = decl.getName();
		if (!name.endsWith('Props')) continue;

		all.push(decl);
		byName.set(name, decl);
	}
}

function findPropsDeclaration(
	lookup: PropsLookup,
	componentName: string | undefined,
): PropsDeclaration | undefined {
	if (componentName) {
		const exact = lookup.byName.get(`${componentName}Props`);
		if (exact) return exact;
	}
	return lookup.all[0];
}

function readTierTag(decl: PropsDeclaration): ExportTier | undefined {
	for (const jsDoc of decl.getJsDocs()) {
		for (const tag of jsDoc.getTags()) {
			if (tag.getTagName() === 'tier') {
				const value = tag.getCommentText()?.trim().toLowerCase();
				if (value === 'atom' || value === 'composed' || value === 'primitive') return value;
			}
		}
	}
	return;
}

function moduleFromPath(filePath: string): string | undefined {
	const markerIndex = filePath.lastIndexOf('/node_modules/');
	if (markerIndex === -1) return;
	const start = markerIndex + '/node_modules/'.length;
	if (start >= filePath.length) return;

	const firstSlash = filePath.indexOf('/', start);
	if (filePath.charCodeAt(start) !== 64 /* @ */) {
		return firstSlash === -1 ? filePath.slice(start) : filePath.slice(start, firstSlash);
	}

	if (firstSlash === -1) return filePath.slice(start);
	const secondSlash = filePath.indexOf('/', firstSlash + 1);
	return secondSlash === -1 ? filePath.slice(start) : filePath.slice(start, secondSlash);
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
	return;
}

function readExtends(decl: InterfaceDeclaration): Array<ParsedExtends> {
	const result: Array<ParsedExtends> = [];
	for (const heritage of decl.getExtends()) {
		const expr = heritage.getExpression();
		const typeName = expr.getText();
		const symbol = expr.getSymbol();
		const declarations = symbol?.getDeclarations() ?? [];

		if (declarations.length === 0) {
			// No declarations — check type arguments for external references
			const resolved = resolveExternalFromTypeArgs(heritage);
			if (resolved) {
				result.push({ from: 'external', module: resolved.module, typeName: resolved.typeName });
			} else {
				result.push({ from: 'external', typeName });
			}
			continue;
		}

		const firstDecl = declarations[0];
		const sourceFilePath = firstDecl?.getSourceFile().getFilePath() ?? '';

		if (sourceFilePath.includes('/node_modules/') && !isTsBuiltinPath(sourceFilePath)) {
			result.push({ from: 'external', module: moduleFromPath(sourceFilePath), typeName });
			continue;
		}

		if (isTsBuiltinPath(sourceFilePath)) {
			const resolved = resolveExternalFromTypeArgs(heritage);
			if (resolved) {
				result.push({ from: 'external', module: resolved.module, typeName: resolved.typeName });
			}
			continue;
		}

		result.push({ from: 'package', typeName });
	}
	return result;
}

function collectMembers(decl: PropsDeclaration): Array<ParsedProp> {
	const out: Array<ParsedProp> = [];
	collectMembersFromDeclaration(decl, undefined, undefined, new Set(), out, new Set());
	return out;
}

function collectMembersFromHeritage(
	heritage: ExpressionWithTypeArguments,
	omit: Set<string> | undefined,
	include: Set<string> | undefined,
	seen: Set<string>,
	out: Array<ParsedProp>,
	names: Set<string>,
): void {
	const typeArgs = heritage.getTypeArguments();
	const expressionText = heritage.getExpression().getText();
	if (typeArgs.length > 0 && isUtilityTypeName(expressionText)) {
		collectUtilityTypeMembers(expressionText, typeArgs, omit, include, seen, out, names);
		return;
	}

	const target = findLocalPropsDeclaration(heritage);
	if (target) collectMembersFromDeclaration(target, omit, include, seen, out, names);
}

function collectMembersFromTypeNode(
	node: TypeNode,
	omit: Set<string> | undefined,
	include: Set<string> | undefined,
	seen: Set<string>,
	out: Array<ParsedProp>,
	names: Set<string>,
): void {
	if (Node.isIntersectionTypeNode(node)) {
		for (const child of node.getTypeNodes()) {
			collectMembersFromTypeNode(child, omit, include, seen, out, names);
		}
		return;
	}

	if (Node.isTypeLiteral(node)) {
		const members = node.getMembers();
		for (let i = 0; i < members.length; i++) {
			const member = members[i];
			if (!member || !Node.isPropertySignature(member)) continue;
			appendParsedProp(member, omit, include, out, names);
		}
		return;
	}

	if (Node.isTypeReference(node) && isUtilityTypeName(node.getTypeName().getText())) {
		collectUtilityTypeMembers(
			node.getTypeName().getText(),
			node.getTypeArguments(),
			omit,
			include,
			seen,
			out,
			names,
		);
		return;
	}

	const target = findLocalPropsDeclaration(node);
	if (target) collectMembersFromDeclaration(target, omit, include, seen, out, names);
}

function collectUtilityTypeMembers(
	name: string,
	typeArgs: Array<TypeNode>,
	omit: Set<string> | undefined,
	include: Set<string> | undefined,
	seen: Set<string>,
	out: Array<ParsedProp>,
	names: Set<string>,
): void {
	const target = typeArgs[0];
	if (!target) return;

	if (name === 'Pick') {
		const picked = readLiteralNames(typeArgs[1]);
		collectMembersFromTypeNode(target, omit, mergeIncludeSets(include, picked), seen, out, names);
		return;
	}

	const omitted = readLiteralNames(typeArgs[1]);
	collectMembersFromTypeNode(target, mergeOmitSets(omit, omitted), include, seen, out, names);
}

function mergeOmitSets(
	outer: Set<string> | undefined,
	inner: Set<string>,
): Set<string> | undefined {
	if (inner.size === 0) return outer;
	if (!outer || outer.size === 0) return inner;

	const merged = new Set(outer);
	for (const name of inner) merged.add(name);
	return merged;
}

function mergeIncludeSets(
	outer: Set<string> | undefined,
	inner: Set<string>,
): Set<string> | undefined {
	if (inner.size === 0) return outer;
	if (!outer || outer.size === 0) return inner;

	const merged = new Set<string>();
	for (const name of inner) {
		if (outer.has(name)) merged.add(name);
	}
	return merged;
}

function collectMembersFromDeclaration(
	decl: PropsDeclaration,
	omit: Set<string> | undefined,
	include: Set<string> | undefined,
	seen: Set<string>,
	out: Array<ParsedProp>,
	names: Set<string>,
): void {
	const key = `${decl.getSourceFile().getFilePath()}:${decl.getName()}`;
	if (seen.has(key)) return;
	seen.add(key);

	if (Node.isTypeAliasDeclaration(decl)) {
		const node = decl.getTypeNode();
		if (node) collectMembersFromTypeNode(node, omit, include, seen, out, names);
		return;
	}

	const properties = decl.getProperties();
	for (let i = 0; i < properties.length; i++) {
		const prop = properties[i];
		if (prop) appendParsedProp(prop, omit, include, out, names);
	}

	const heritageClauses = decl.getExtends();
	for (let i = 0; i < heritageClauses.length; i++) {
		const heritage = heritageClauses[i];
		if (heritage) collectMembersFromHeritage(heritage, omit, include, seen, out, names);
	}
}

function appendParsedProp(
	prop: PropertySignature,
	omit: Set<string> | undefined,
	include: Set<string> | undefined,
	out: Array<ParsedProp>,
	names: Set<string>,
): void {
	const name = prop.getName();
	if (omit?.has(name) || (include && !include.has(name)) || names.has(name)) return;

	out.push(toParsedProp(prop));
	names.add(name);
}

function findLocalPropsDeclaration(
	node: TypeNode | ExpressionWithTypeArguments,
): PropsDeclaration | undefined {
	const symbol = node.getType().getSymbol() ?? node.getType().getAliasSymbol();
	const declarations = symbol?.getDeclarations() ?? [];
	return declarations.find(
		(decl): decl is PropsDeclaration =>
			(Node.isInterfaceDeclaration(decl) || Node.isTypeAliasDeclaration(decl)) &&
			!decl.getSourceFile().getFilePath().includes('/node_modules/'),
	);
}

function isUtilityTypeName(name: string): boolean {
	return name === 'Omit' || name === 'DistributiveOmit' || name === 'Pick';
}

function readLiteralNames(node: TypeNode | undefined): Set<string> {
	const out = new Set<string>();
	if (!node) return out;
	if (Node.isLiteralTypeNode(node)) {
		const literal = node.getLiteral();
		if (Node.isStringLiteral(literal)) out.add(literal.getLiteralText());
		return out;
	}
	if (Node.isTypeOperatorTypeNode(node) && node.getOperator() === SyntaxKind.KeyOfKeyword) {
		appendPropNamesFromTypeNode(node.getTypeNode(), out, new Set());
		return out;
	}
	if (Node.isUnionTypeNode(node)) {
		for (const child of node.getTypeNodes()) {
			for (const name of readLiteralNames(child)) out.add(name);
		}
	}
	return out;
}

function appendPropNamesFromTypeNode(node: TypeNode, out: Set<string>, seen: Set<string>): void {
	if (Node.isTypeLiteral(node)) {
		const members = node.getMembers();
		for (let i = 0; i < members.length; i++) {
			const member = members[i];
			if (member && Node.isPropertySignature(member)) out.add(member.getName());
		}
		return;
	}

	if (Node.isIntersectionTypeNode(node)) {
		for (const child of node.getTypeNodes()) {
			appendPropNamesFromTypeNode(child, out, seen);
		}
		return;
	}

	const target = findLocalPropsDeclaration(node);
	if (target) appendPropNamesFromDeclaration(target, out, seen);
}

function appendPropNamesFromDeclaration(
	decl: PropsDeclaration,
	out: Set<string>,
	seen: Set<string>,
): void {
	const key = `${decl.getSourceFile().getFilePath()}:${decl.getName()}`;
	if (seen.has(key)) return;
	seen.add(key);

	if (Node.isTypeAliasDeclaration(decl)) {
		const node = decl.getTypeNode();
		if (node) appendPropNamesFromTypeNode(node, out, seen);
		return;
	}

	const properties = decl.getProperties();
	for (let i = 0; i < properties.length; i++) {
		const prop = properties[i];
		if (prop) out.add(prop.getName());
	}

	const heritageClauses = decl.getExtends();
	for (let i = 0; i < heritageClauses.length; i++) {
		const heritage = heritageClauses[i];
		const target = heritage ? findLocalPropsDeclaration(heritage) : undefined;
		if (target) appendPropNamesFromDeclaration(target, out, seen);
	}
}

function toParsedProp(prop: PropertySignature): ParsedProp {
	const jsDoc = prop.getJsDocs()[0];
	const description = jsDoc?.getDescription().trim() ?? '';
	const defaultValue = (jsDoc?.getTags() ?? [])
		.find((tag) => tag.getTagName() === 'default')
		?.getCommentText()
		?.trim();
	return {
		default: defaultValue,
		description,
		name: prop.getName(),
		optional: prop.hasQuestionToken(),
		type: resolvePropType(prop),
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
	description: string;
	name: string;
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
	const sourceFile = getSourceFile(sourcePath);

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

		// Resolve description with fallback to the re-export line's JSDoc.
		const jsDoc = getJsDoc(firstDecl);
		const declDesc = jsDoc?.getDescription().trim() ?? '';
		const desc = declDesc || (reExportDescriptions.get(name) ?? '');

		if (kind === SyntaxKind.InterfaceDeclaration || kind === SyntaxKind.TypeAliasDeclaration) {
			if (isCompanionTypeExport(name, desc)) continue;
			// Standalone type alias with a description (e.g. ComboboxSize) — include it briefly.
			exports.push({ description: desc, name, type: getTypeSignature(firstDecl, name) });
			continue;
		}

		// Runtime export (function, class, arrow function, etc.)
		const type = getTypeSignature(firstDecl, name);
		exports.push({ description: desc, name, type });
	}

	// Sort alphabetically for stable output.
	exports.sort((a, b) => a.name.localeCompare(b.name));

	return { description, exports };
}

/**
 * Decide whether a pure type export (interface or type alias) from a barrel is
 * a "companion" type — i.e. paired with a runtime export and surfaced via its
 * `type` field rather than listed as its own entry.
 *
 * Heuristic: skip pure type exports whose name ends in `Props` or whose
 * description (declaration JSDoc, falling back to the re-export line JSDoc) is
 * empty. Standalone public types (e.g. `ComboboxSize` with a description)
 * still appear in the barrel's export list.
 */
function isCompanionTypeExport(name: string, description: string): boolean {
	return name.endsWith('Props') || !description;
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
		if (!lastRange?.getText().startsWith('/**')) continue;
		const desc = stripJsDocMarkers(lastRange.getText());
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
	if (!jsDocRange?.getText().startsWith('/**')) return '';
	// Strip /** ... */ markers and leading * on each line.
	return stripJsDocMarkers(jsDocRange.getText());
}

/**
 * Strip `/** … *​/` markers and leading `*` on each line.
 * Single-pass: avoids intermediate array allocations from `.split().map().join()`.
 */
function stripJsDocMarkers(raw: string): string {
	let start = raw.startsWith('/**') ? 3 : 0;
	let end = raw.endsWith('*/') ? raw.length - 2 : raw.length;
	while (start < end && raw.charCodeAt(start) <= 32) start++;
	while (end > start && raw.charCodeAt(end - 1) <= 32) end--;

	const out: Array<string> = [];
	let i = start;
	while (i < end) {
		const nl = raw.indexOf('\n', i);
		const lineEnd = nl === -1 ? end : nl;
		let j = i;
		while (j < lineEnd && raw.charCodeAt(j) <= 32) j++;
		if (j < lineEnd && raw.charCodeAt(j) === 42 /* * */) {
			j++;
			if (j < lineEnd && raw.charCodeAt(j) === 32 /* space */) j++;
		}
		out.push(raw.slice(j, lineEnd));
		i = lineEnd + 1;
	}
	return out.join('\n').trim();
}

/** Return the JSDoc attached to a node, if any. */
function getJsDoc(node: Node) {
	// ts-morph exposes getJsDocs() on many node types via mixin.
	type JsDocLike = { getDescription(): string };
	type JsDocHost = Node & { getJsDocs: () => Array<JsDocLike> };
	const hasJsDocs = (n: Node): n is JsDocHost =>
		'getJsDocs' in n && typeof n.getJsDocs === 'function';
	const tryGet = (n: Node) => (hasJsDocs(n) ? (n.getJsDocs()[0] ?? null) : null);
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
	if (Node.isFunctionDeclaration(node)) {
		const params = node
			.getParameters()
			.map((p) => `${p.getName()}: ${p.getType().getText(p)}`)
			.join(', ');
		const returnType = node.getReturnType().getText(node);
		// Skip massive return types.
		if (returnType.length > 80) return;
		const cleanParams = stripImportPaths(params);
		const cleanReturn = stripImportPaths(returnType);
		return `function ${name}(${cleanParams}): ${cleanReturn}`;
	}

	if (Node.isTypeAliasDeclaration(node)) {
		const text = node.getTypeNode()?.getText() ?? '';
		// Skip large union types.
		if (text.length > 120) return;
		return `type ${name} = ${text}`;
	}

	return;
}
