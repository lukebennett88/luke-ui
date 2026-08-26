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

interface PublicExports {
	types: Map<string, Set<string>>;
	values: Map<string, Set<string>>;
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

	const modules = localContractModules(entryModule);
	const publicTypes = publicTypeNames(modules);
	const required = new Set<string>();
	const unsupported = new Set<string>();

	for (const { module, types, values } of modules) {
		const declarations = typeDeclarations(module);
		for (const signature of exportedSignatures(module.program, values)) {
			if (signature.unsupported) {
				for (const name of values.get(signature.name) ?? []) unsupported.add(name);
				continue;
			}
			for (const type of signature.types) {
				if (!isPublicObjectType(type, types, declarations)) continue;
				for (const name of types.get(type) ?? []) required.add(name);
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
): Array<{ module: ParsedModule } & PublicExports> {
	const modules = new Map<string, { module: ParsedModule } & PublicExports>();
	const entryExports = exportedNames(entryModule.program);
	modules.set(entryModule.path, { module: entryModule, ...entryExports });
	const pending = [entryModule.path];
	const entryDir = dirname(entryModule.path);

	while (pending.length > 0) {
		const path = pending.pop();
		if (path === undefined) continue;
		const current = modules.get(path);
		if (current === undefined) continue;

		for (const target of localReexports(current.module, current)) {
			if (modules.has(target.path)) {
				const existing = modules.get(target.path);
				if (existing !== undefined && mergePublicExports(existing, target))
					pending.push(target.path);
				continue;
			}

			const targetPath = target.path;
			if (targetPath.endsWith('.css.ts') || !isInsideDirectory(targetPath, entryDir)) continue;

			const module = parseModule(targetPath);
			if (module === undefined) continue;
			modules.set(targetPath, { module, types: target.types, values: target.values });
			pending.push(targetPath);
		}
	}

	return [...modules.values()];
}

function localReexports(
	module: ParsedModule,
	publicExports: PublicExports,
): Array<{ path: string } & PublicExports> {
	const importedLocals = new Map<string, { name: string; source: string }>();

	for (const statement of body(module.program)) {
		if (statement.type !== 'ImportDeclaration') continue;
		const source = literalString(statement.source);
		if (source === undefined || !source.startsWith('.')) continue;

		for (const specifier of nodes(statement.specifiers)) {
			const local = identifierName(specifier.local);
			const imported = identifierName(specifier.imported);
			if (local !== undefined && imported !== undefined) {
				importedLocals.set(local, { name: imported, source });
			}
		}
	}

	const reexports = new Map<string, { path: string } & PublicExports>();

	for (const statement of body(module.program)) {
		if (statement.type !== 'ExportNamedDeclaration') continue;
		const source = literalString(statement.source);

		if (source !== undefined) {
			if (!source.startsWith('.')) continue;
			addReexportedNames(
				reexports,
				resolveLocalModule(module.path, source),
				statement,
				publicExports,
			);
			continue;
		}

		for (const specifier of nodes(statement.specifiers)) {
			const local = identifierName(specifier.local);
			if (local === undefined) continue;
			const imported = importedLocals.get(local);
			if (imported === undefined) continue;
			addReexportedName(
				reexports,
				resolveLocalModule(module.path, imported.source),
				imported.name,
				specifier,
				publicExports,
				statement,
			);
		}
	}

	return [...reexports.values()];
}

function addReexportedNames(
	reexports: Map<string, { path: string } & PublicExports>,
	path: string,
	statement: AstNode,
	publicExports: PublicExports,
): void {
	for (const specifier of nodes(statement.specifiers)) {
		const local = identifierName(specifier.local);
		if (local === undefined) continue;
		addReexportedName(reexports, path, local, specifier, publicExports, statement);
	}
}

function addReexportedName(
	reexports: Map<string, { path: string } & PublicExports>,
	path: string,
	targetName: string,
	specifier: AstNode,
	publicExports: PublicExports,
	statement: AstNode,
): void {
	const local = identifierName(specifier.local);
	if (local === undefined) return;
	const kind = exportKind(statement, specifier);
	const names = kind === 'type' ? publicExports.types.get(local) : publicExports.values.get(local);
	if (names === undefined) return;

	const reexport = reexports.get(path) ?? { path, types: new Map(), values: new Map() };
	for (const name of names)
		addPublicName(reexport[kind === 'type' ? 'types' : 'values'], targetName, name);
	reexports.set(path, reexport);
}

function resolveLocalModule(entryPath: string, specifier: string): string {
	const base = resolve(dirname(entryPath), specifier.replace(/\.js$/, ''));
	for (const extension of ['.ts', '.tsx', '.css.ts', '.css.tsx']) {
		const path = `${base}${extension}`;
		if (existsSync(path)) return path;
	}
	return `${base}.ts`;
}

function mergePublicExports(target: PublicExports, source: PublicExports): boolean {
	const typesChanged = mergePublicNames(target.types, source.types);
	const valuesChanged = mergePublicNames(target.values, source.values);
	return typesChanged || valuesChanged;
}

function mergePublicNames(
	target: Map<string, Set<string>>,
	source: ReadonlyMap<string, ReadonlySet<string>>,
): boolean {
	let changed = false;
	for (const [local, exported] of source) {
		for (const name of exported) {
			if (addPublicName(target, local, name)) changed = true;
		}
	}
	return changed;
}

function addPublicName(names: Map<string, Set<string>>, local: string, exported: string): boolean {
	const existing = names.get(local);
	if (existing !== undefined) {
		if (existing.has(exported)) return false;
		existing.add(exported);
		return true;
	}
	names.set(local, new Set([exported]));
	return true;
}

function exportKind(statement: AstNode, specifier: AstNode): 'type' | 'value' {
	return stringValue(statement.exportKind) === 'type' ||
		stringValue(specifier.exportKind) === 'type'
		? 'type'
		: 'value';
}

function parseModule(path: string): ParsedModule | undefined {
	if (!existsSync(path)) return undefined;
	const result = parseSync(path, readFileSync(path, 'utf8'));
	if (result.errors.length > 0) return undefined;
	return { path, program: result.program as unknown as AstNode };
}

function exportedNames(program: AstNode): PublicExports {
	const types = new Map<string, Set<string>>();
	const values = new Map<string, Set<string>>();

	for (const statement of body(program)) {
		if (statement.type !== 'ExportNamedDeclaration') continue;

		const declaration = astNode(statement.declaration);
		if (declaration !== undefined) {
			const name = declarationName(declaration);
			if (name !== undefined)
				addPublicName(declarationKind(declaration) === 'type' ? types : values, name, name);
		}

		for (const specifier of nodes(statement.specifiers)) {
			const local = identifierName(specifier.local);
			const exported = identifierName(specifier.exported);
			if (local !== undefined && exported !== undefined) {
				addPublicName(
					exportKind(statement, specifier) === 'type' ? types : values,
					local,
					exported,
				);
			}
		}
	}

	return { types, values };
}

function publicTypeNames(modules: ReadonlyArray<PublicExports>): Set<string> {
	const names = new Set<string>();
	for (const { types } of modules) {
		for (const exported of types.values()) {
			for (const name of exported) names.add(name);
		}
	}
	return names;
}

function isPublicObjectType(
	name: string,
	publicTypes: ReadonlyMap<string, ReadonlySet<string>>,
	declarations: ReadonlyMap<string, AstNode>,
): boolean {
	if (!publicTypes.has(name)) return false;
	const declaration = declarations.get(name);
	return declaration !== undefined && isObjectType(declaration, name, declarations);
}

function typeDeclarations(module: ParsedModule): Map<string, AstNode> {
	const declarations = new Map<string, AstNode>();

	for (const statement of body(module.program)) {
		const declaration =
			statement.type === 'ExportNamedDeclaration' ? astNode(statement.declaration) : statement;
		if (declaration === undefined || declarationKind(declaration) !== 'type') continue;
		const name = declarationName(declaration);
		if (name !== undefined) declarations.set(name, declaration);
	}

	return declarations;
}

function isObjectType(
	declaration: AstNode,
	name: string,
	declarations: ReadonlyMap<string, AstNode>,
	seen: Set<string> = new Set(),
	substitutions: ReadonlyMap<string, AstNode> = new Map(),
): boolean {
	if (name.endsWith('RecipeVariants')) return false;
	if (declaration.type === 'TSInterfaceDeclaration') return true;
	if (declaration.type !== 'TSTypeAliasDeclaration') return false;
	if (seen.has(name)) return false;
	seen.add(name);

	return isObjectAnnotation(astNode(declaration.typeAnnotation), declarations, substitutions, seen);
}

// Follow a local alias, substituting type parameters. Names outside this module stay object-shaped.
function isObjectAnnotation(
	annotation: AstNode | undefined,
	declarations: ReadonlyMap<string, AstNode>,
	substitutions: ReadonlyMap<string, AstNode>,
	seen: Set<string>,
): boolean {
	if (annotation === undefined) return false;
	if (
		annotation.type === 'TSTypeLiteral' ||
		annotation.type === 'TSIntersectionType' ||
		annotation.type === 'TSMappedType'
	) {
		return true;
	}
	if (annotation.type !== 'TSTypeReference') return false;

	const name = identifierName(annotation.typeName);
	if (name === undefined) return true;

	if (!hasTypeArguments(annotation)) {
		const substituted = substitutions.get(name);
		if (substituted !== undefined) {
			return isObjectAnnotation(substituted, declarations, substitutions, seen);
		}
	}

	const target = declarations.get(name);
	if (target === undefined) return true;
	return isObjectType(
		target,
		name,
		declarations,
		seen,
		bindTypeParameters(target, annotation, substitutions),
	);
}

function bindTypeParameters(
	declaration: AstNode,
	reference: AstNode,
	substitutions: ReadonlyMap<string, AstNode>,
): Map<string, AstNode> {
	const names = typeParameterNames(declaration);
	const args = nodes(astNode(reference.typeArguments)?.params);
	const bound = new Map<string, AstNode>();

	for (const [index, name] of names.entries()) {
		const argument = args[index];
		if (argument === undefined) continue;
		bound.set(name, resolveSubstitutions(argument, substitutions));
	}

	return bound;
}

function typeParameterNames(declaration: AstNode): ReadonlyArray<string> {
	return nodes(astNode(declaration.typeParameters)?.params).flatMap((parameter) => {
		const name = identifierName(parameter.name);
		return name === undefined ? [] : [name];
	});
}

function resolveSubstitutions(
	annotation: AstNode,
	substitutions: ReadonlyMap<string, AstNode>,
): AstNode {
	const seen = new Set<string>();
	let current = annotation;

	while (current.type === 'TSTypeReference' && !hasTypeArguments(current)) {
		const name = identifierName(current.typeName);
		if (name === undefined || seen.has(name)) break;
		seen.add(name);
		const next = substitutions.get(name);
		if (next === undefined) break;
		current = next;
	}

	return current;
}

function hasTypeArguments(node: AstNode): boolean {
	const typeArguments = astNode(node.typeArguments);
	return typeArguments !== undefined && nodes(typeArguments.params).length > 0;
}

function exportedSignatures(
	program: AstNode,
	publicValues: ReadonlyMap<string, ReadonlySet<string>>,
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
