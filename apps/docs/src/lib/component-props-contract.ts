import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { parseSync } from 'oxc-parser';
import type { ComponentGuideInventory } from './component-guide-inventory.js';

const SOURCE_PREFIX = 'packages/@luke-ui/react/src/';

interface AstNode {
	readonly type: string;
	readonly [key: string]: unknown;
}

interface ParsedModule {
	path: string;
	program: AstNode;
}

/** Checks Props frontmatter against object contracts from a public entry point and its local re-export chain. */
export function findComponentPropsContractIssues(
	inventory: ComponentGuideInventory,
	reactPackageDir: string,
): Array<string> {
	const issues: Array<string> = [];

	for (const guide of inventory.guides) {
		if (guide.source === undefined || !guide.source.startsWith(SOURCE_PREFIX)) continue;

		const entryPath = resolve(
			reactPackageDir,
			'src',
			guide.source.slice(SOURCE_PREFIX.length),
			'index.ts',
		);
		if (!existsSync(entryPath)) continue;

		issues.push(...findGuideIssues(guide.relativePath, guide.props, guide.source, entryPath));
	}

	return issues;
}

function findGuideIssues(
	guidePath: string,
	frontmatterProps: ReadonlyArray<{ name: string }>,
	source: string,
	entryPath: string,
): Array<string> {
	const entryModule = parseModule(entryPath);
	if (entryModule === undefined) return [];

	const publicTypes = publicTypeNames(entryModule.program);
	const publicValues = publicValueNames(entryModule.program);
	const publicNames = new Set([...publicTypes, ...publicValues]);
	const modules = [entryModule, ...localContractModules(entryModule, publicNames)];
	const objectTypes = objectTypeNames(modules);
	const required = new Set<string>();
	const unsupported = new Set<string>();

	for (const module of modules) {
		for (const signature of exportedSignatures(module.program, publicValues)) {
			if (signature.unsupported) {
				unsupported.add(signature.name);
				continue;
			}
			for (const type of signature.types) {
				if (publicTypes.has(type) && objectTypes.has(type)) required.add(type);
			}
		}
	}

	const entryPoint = `${source}/index.ts`;
	const documented = new Set(frontmatterProps.map((entry) => entry.name));
	const issues: Array<string> = [];

	for (const type of required) {
		if (documented.has(type)) continue;
		issues.push(
			`${guidePath}: entry point "${entryPoint}" requires public object contract "${type}" in props frontmatter`,
		);
	}

	for (const type of documented) {
		if (publicTypes.has(type)) continue;
		issues.push(
			`${guidePath}: entry point "${entryPoint}" does not export props frontmatter type "${type}"`,
		);
	}

	for (const name of unsupported) {
		issues.push(
			`${guidePath}: entry point "${entryPoint}" has an unsupported exported signature "${name}"`,
		);
	}

	return issues;
}

// Public names may be imported and re-exported by an intermediate file. Follow those local
// modules so the callable signature that is inspected is the one consumers actually import.
// Stay inside the entry directory so generated data modules are not scanned.
function localContractModules(
	entryModule: ParsedModule,
	publicNames: ReadonlySet<string>,
): Array<ParsedModule> {
	const modules: Array<ParsedModule> = [];
	const seen = new Set<string>([entryModule.path]);
	const pending: Array<ParsedModule> = [entryModule];
	const entryDir = dirname(entryModule.path);

	while (pending.length > 0) {
		const current = pending.pop();
		if (current === undefined) continue;

		for (const path of localReexportPaths(current, publicNames)) {
			if (seen.has(path)) continue;
			seen.add(path);
			if (path.endsWith('.css.ts') || !isInsideDirectory(path, entryDir)) continue;

			const module = parseModule(path);
			if (module === undefined) continue;
			modules.push(module);
			pending.push(module);
		}
	}

	return modules;
}

function localReexportPaths(module: ParsedModule, publicNames: ReadonlySet<string>): Array<string> {
	const importedLocals = new Map<string, string>();

	for (const statement of body(module.program)) {
		if (statement.type !== 'ImportDeclaration') continue;
		const source = literalString(statement.source);
		if (source === undefined || !source.startsWith('.')) continue;

		for (const specifier of nodes(statement.specifiers)) {
			const local = identifierName(specifier.local);
			if (local !== undefined) importedLocals.set(local, source);
		}
	}

	const paths = new Set<string>();

	for (const statement of body(module.program)) {
		if (statement.type !== 'ExportNamedDeclaration') continue;
		const source = literalString(statement.source);

		if (source !== undefined) {
			if (!source.startsWith('.')) continue;
			if (exportsPublicName(statement, publicNames)) {
				paths.add(resolveLocalModule(module.path, source));
			}
			continue;
		}

		for (const specifier of nodes(statement.specifiers)) {
			if (!exportsPublicSpecifier(specifier, publicNames)) continue;
			const local = identifierName(specifier.local);
			if (local === undefined) continue;
			const importSource = importedLocals.get(local);
			if (importSource !== undefined) {
				paths.add(resolveLocalModule(module.path, importSource));
			}
		}
	}

	return [...paths];
}

function exportsPublicName(statement: AstNode, publicNames: ReadonlySet<string>): boolean {
	for (const specifier of nodes(statement.specifiers)) {
		if (exportsPublicSpecifier(specifier, publicNames)) return true;
	}
	return false;
}

function exportsPublicSpecifier(specifier: AstNode, publicNames: ReadonlySet<string>): boolean {
	const exported = identifierName(specifier.exported);
	const local = identifierName(specifier.local);
	return (
		(exported !== undefined && publicNames.has(exported)) ||
		(local !== undefined && publicNames.has(local))
	);
}

function resolveLocalModule(entryPath: string, specifier: string): string {
	const base = resolve(dirname(entryPath), specifier.replace(/\.js$/, ''));
	for (const extension of ['.ts', '.tsx', '.css.ts', '.css.tsx']) {
		const path = `${base}${extension}`;
		if (existsSync(path)) return path;
	}
	return `${base}.ts`;
}

function parseModule(path: string): ParsedModule | undefined {
	if (!existsSync(path)) return undefined;
	const result = parseSync(path, readFileSync(path, 'utf8'));
	if (result.errors.length > 0) return undefined;
	return { path, program: result.program as unknown as AstNode };
}

function publicTypeNames(program: AstNode): Set<string> {
	return exportedNames(program, 'type');
}

function publicValueNames(program: AstNode): Set<string> {
	return exportedNames(program, 'value');
}

function exportedNames(program: AstNode, kind: 'type' | 'value'): Set<string> {
	const names = new Set<string>();

	for (const statement of body(program)) {
		if (statement.type !== 'ExportNamedDeclaration') continue;

		const declaration = astNode(statement.declaration);
		if (declaration !== undefined && declarationKind(declaration) === kind) {
			const name = declarationName(declaration);
			if (name !== undefined) names.add(name);
		}

		for (const specifier of nodes(statement.specifiers)) {
			const exportKind =
				stringValue(statement.exportKind) === 'type' ? 'type' : stringValue(specifier.exportKind);
			if ((exportKind === 'type') !== (kind === 'type')) continue;
			const name = identifierName(specifier.exported);
			if (name !== undefined) names.add(name);
		}
	}

	return names;
}

function objectTypeNames(modules: ReadonlyArray<ParsedModule>): Set<string> {
	const declarations = typeDeclarations(modules);
	const names = new Set<string>();

	for (const module of modules) {
		for (const statement of body(module.program)) {
			if (statement.type !== 'ExportNamedDeclaration') continue;
			const declaration = astNode(statement.declaration);
			if (declaration === undefined || declarationKind(declaration) !== 'type') continue;
			const name = declarationName(declaration);
			if (name !== undefined && isObjectType(declaration, name, declarations)) names.add(name);
		}
	}

	return names;
}

function typeDeclarations(modules: ReadonlyArray<ParsedModule>): Map<string, AstNode> {
	const declarations = new Map<string, AstNode>();

	for (const module of modules) {
		for (const statement of body(module.program)) {
			const declaration =
				statement.type === 'ExportNamedDeclaration' ? astNode(statement.declaration) : statement;
			if (declaration === undefined || declarationKind(declaration) !== 'type') continue;
			const name = declarationName(declaration);
			if (name !== undefined) declarations.set(name, declaration);
		}
	}

	return declarations;
}

function isObjectType(
	declaration: AstNode,
	name: string,
	declarations: ReadonlyMap<string, AstNode>,
	seen: Set<string> = new Set(),
): boolean {
	if (name.endsWith('RecipeVariants')) return false;
	if (declaration.type === 'TSInterfaceDeclaration') return true;
	if (declaration.type !== 'TSTypeAliasDeclaration') return false;
	if (seen.has(name)) return false;
	seen.add(name);

	const annotation = astNode(declaration.typeAnnotation);
	if (
		annotation?.type === 'TSTypeLiteral' ||
		annotation?.type === 'TSIntersectionType' ||
		annotation?.type === 'TSMappedType'
	) {
		return true;
	}

	if (annotation?.type !== 'TSTypeReference') return false;
	// Follow a simple local alias. Parameterized references and names outside the
	// scanned modules stay object-shaped.
	if (hasTypeArguments(annotation)) return true;

	const referenced = identifierName(annotation.typeName);
	if (referenced === undefined) return true;
	const target = declarations.get(referenced);
	if (target === undefined) return true;
	return isObjectType(target, referenced, declarations, seen);
}

function hasTypeArguments(node: AstNode): boolean {
	const typeArguments = astNode(node.typeArguments);
	return typeArguments !== undefined && nodes(typeArguments.params).length > 0;
}

function exportedSignatures(
	program: AstNode,
	publicValues: ReadonlySet<string>,
): Array<{
	name: string;
	types: ReadonlySet<string>;
	unsupported: boolean;
}> {
	const signatures: Array<{ name: string; types: ReadonlySet<string>; unsupported: boolean }> = [];

	for (const statement of body(program)) {
		if (statement.type !== 'ExportNamedDeclaration') continue;
		const declaration = astNode(statement.declaration);
		if (declaration === undefined) continue;

		if (declaration.type === 'FunctionDeclaration') {
			const name = declarationName(declaration);
			if (name !== undefined && publicValues.has(name)) {
				signatures.push({ name, types: signatureTypeNames(declaration), unsupported: false });
			}
			continue;
		}

		if (declaration.type !== 'VariableDeclaration') continue;
		for (const declarator of nodes(declaration.declarations)) {
			const name = identifierName(declarator.id);
			if (name === undefined || !publicValues.has(name)) continue;
			const initializer = astNode(declarator.init);
			if (
				initializer?.type === 'ArrowFunctionExpression' ||
				initializer?.type === 'FunctionExpression'
			) {
				signatures.push({ name, types: signatureTypeNames(initializer), unsupported: false });
			} else if (isFunctionType(typeAnnotation(astNode(declarator.id)))) {
				signatures.push({ name, types: new Set(), unsupported: true });
			}
		}
	}

	return signatures;
}

function signatureTypeNames(signature: AstNode): Set<string> {
	const names = new Set<string>();

	for (const parameter of nodes(astNode(signature.typeParameters)?.params)) {
		addTypeReferences(names, astNode(parameter.constraint));
	}
	for (const parameter of nodes(signature.params)) {
		addTypeReferences(names, typeAnnotation(parameter));
	}
	addTypeReferences(names, typeAnnotation(astNode(signature.returnType)));

	return names;
}

function isFunctionType(node: AstNode | undefined): boolean {
	return node?.type === 'TSFunctionType' || node?.type === 'TSConstructorType';
}

function isInsideDirectory(filePath: string, directory: string): boolean {
	const dir = resolve(directory);
	const file = resolve(filePath);
	return file === dir || file.startsWith(`${dir}${sep}`);
}

function typeAnnotation(node: AstNode | undefined): AstNode | undefined {
	if (node === undefined) return undefined;
	if (node.type === 'AssignmentPattern') return typeAnnotation(astNode(node.left));
	if (node.type === 'RestElement') return typeAnnotation(astNode(node.argument));
	const annotation = astNode(node.typeAnnotation);
	if (annotation?.type === 'TSTypeAnnotation') return astNode(annotation.typeAnnotation);
	return annotation;
}

function addTypeReferences(names: Set<string>, node: AstNode | undefined): void {
	if (node === undefined) return;
	if (node.type === 'TSTypeReference') {
		const name = identifierName(node.typeName);
		if (name !== undefined) names.add(name);
	}

	for (const value of Object.values(node)) {
		if (Array.isArray(value)) {
			for (const child of value) addTypeReferences(names, astNode(child));
		} else {
			addTypeReferences(names, astNode(value));
		}
	}
}

function declarationKind(declaration: AstNode): 'type' | 'value' {
	return declaration.type === 'TSInterfaceDeclaration' ||
		declaration.type === 'TSTypeAliasDeclaration'
		? 'type'
		: 'value';
}

function declarationName(declaration: AstNode): string | undefined {
	if (declaration.type === 'VariableDeclaration') return undefined;
	return identifierName(declaration.id);
}

function body(program: AstNode): ReadonlyArray<AstNode> {
	return nodes(program.body);
}

function nodes(value: unknown): ReadonlyArray<AstNode> {
	return Array.isArray(value)
		? value.flatMap((entry) => (astNode(entry) === undefined ? [] : [entry]))
		: [];
}

function astNode(value: unknown): AstNode | undefined {
	if (typeof value !== 'object' || value === null || !('type' in value)) return undefined;
	const candidate = value as { type?: unknown };
	return typeof candidate.type === 'string' ? (value as AstNode) : undefined;
}

function identifierName(value: unknown): string | undefined {
	const node = astNode(value);
	return node?.type === 'Identifier' ? stringValue(node.name) : undefined;
}

function literalString(value: unknown): string | undefined {
	const node = astNode(value);
	return node?.type === 'Literal' ? stringValue(node.value) : undefined;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}
