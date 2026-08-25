import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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

/** Checks Props frontmatter against object contracts in a public component entry point. */
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

	const modules = [entryModule, ...localExportModules(entryModule)];
	const publicTypes = publicTypeNames(entryModule.program);
	const publicValues = publicValueNames(entryModule.program);
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

function localExportModules(entryModule: ParsedModule): Array<ParsedModule> {
	const modules: Array<ParsedModule> = [];
	const paths = new Set<string>();

	for (const statement of body(entryModule.program)) {
		if (statement.type !== 'ExportNamedDeclaration') continue;
		const source = literalString(statement.source);
		if (source === undefined || !source.startsWith('.')) continue;

		const path = resolveLocalModule(entryModule.path, source);
		if (paths.has(path)) continue;
		paths.add(path);

		const module = parseModule(path);
		if (module !== undefined && !module.path.endsWith('.css.ts')) modules.push(module);
	}

	return modules;
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
	const names = new Set<string>();

	for (const module of modules) {
		for (const statement of body(module.program)) {
			if (statement.type !== 'ExportNamedDeclaration') continue;
			const declaration = astNode(statement.declaration);
			if (declaration === undefined || declarationKind(declaration) !== 'type') continue;
			const name = declarationName(declaration);
			if (name !== undefined && isObjectType(declaration, name)) names.add(name);
		}
	}

	return names;
}

function isObjectType(declaration: AstNode, name: string): boolean {
	if (name.endsWith('RecipeVariants')) return false;
	if (declaration.type === 'TSInterfaceDeclaration') return true;
	if (declaration.type !== 'TSTypeAliasDeclaration') return false;

	const annotation = astNode(declaration.typeAnnotation);
	return (
		annotation?.type === 'TSTypeLiteral' ||
		annotation?.type === 'TSIntersectionType' ||
		annotation?.type === 'TSTypeReference' ||
		annotation?.type === 'TSMappedType'
	);
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
			} else if (astNode(declarator.id)?.typeAnnotation !== undefined) {
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
