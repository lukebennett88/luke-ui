import { isAbsolute, relative, resolve, sep } from 'node:path';
import { ts } from 'ts-morph';
import { createTypeTokenPrinter } from './print-type-tokens.js';
import type { TypeDefinition, TypeDefinitionsPayload } from './type-definition-model.js';
import type { TypeToken } from './type-tokens.js';
import { typeTokensToText } from './type-tokens.js';

/**
 * The flags fumadocs prints prop types with, so a walked node names what the table shows.
 * `typeToString` adds `IgnoreErrors` the same way.
 */
const PRINTED_TYPE_FLAGS =
	ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope |
	ts.NodeBuilderFlags.NoTruncation |
	ts.NodeBuilderFlags.IgnoreErrors;

const printer = ts.createPrinter({ removeComments: true });

const NULLISH_TYPES = new Set(['null', 'undefined']);

/** Longest external type alias whose declaration is copied. Longer ones keep only their package. */
const MAX_EXTERNAL_DEFINITION_LENGTH = 400;

/**
 * Bounds the definitions one table expands through other definitions. Past it, those names stay
 * listed without their definitions. A name a row signature shows is always expanded.
 */
const MAX_DEFINITIONS = 60;

const NODE_MODULES_SEGMENT = `${sep}node_modules${sep}`;
const TYPESCRIPT_LIB_PATTERN = /[/\\]node_modules[/\\]typescript[/\\]lib[/\\]/;
const SCOPED_PACKAGE_PATTERN = /^@[^/]+\/[^/]+/;
const UNSCOPED_PACKAGE_PATTERN = /^[^/]+/;

/** Declaration kinds that give a named type a definition. */
const NAMED_TYPE_KINDS = new Set([
	ts.SyntaxKind.ClassDeclaration,
	ts.SyntaxKind.EnumDeclaration,
	ts.SyntaxKind.InterfaceDeclaration,
	ts.SyntaxKind.TypeAliasDeclaration,
]);

/** Syntax whose meaning the declaration text does not show, so `resolved` is worth keeping. */
const OPAQUE_TYPE_KINDS = new Set([
	ts.SyntaxKind.ConditionalType,
	ts.SyntaxKind.IndexedAccessType,
	ts.SyntaxKind.MappedType,
	ts.SyntaxKind.TypeOperator,
	ts.SyntaxKind.TypeQuery,
]);

export interface TypeDefinitionCollector {
	/** Records the named types a written annotation refers to, and returns it formatted. */
	addTypeNode: (node: ts.TypeNode) => Array<TypeToken>;
	/**
	 * Records the named types the checker prints for a resolved type, and returns it formatted. With
	 * `omitUndefined`, the `undefined` TypeScript adds to an optional prop is left out.
	 */
	addType: (type: ts.Type, options: { omitUndefined: boolean }) => Array<TypeToken> | undefined;
	/** The recorded definitions in order of first reference, or `undefined` when there are none. */
	definitions: () => TypeDefinitionsPayload | undefined;
}

type SymbolResolver = (name: ts.Identifier) => ts.Symbol | undefined;

const resolveBuiltSymbol: SymbolResolver = (name) => (name as { symbol?: ts.Symbol }).symbol;

/**
 * Collects the definitions a props table's signatures refer to.
 *
 * Luke UI types, declared anywhere in the `@luke-ui/react` package at `packageDir`, are followed
 * through their definitions until every Luke UI name in the payload has its own key. External types
 * record their package and declaring file. A short external type alias also keeps its declaration,
 * but the names in it are not followed further. TypeScript's own library types are left out, like
 * primitive keywords. Each type name in a formatted type carries the key of its definition.
 */
export function createTypeDefinitionCollector({
	checker,
	enclosingDeclaration,
	packageDir,
}: {
	checker: ts.TypeChecker;
	enclosingDeclaration: ts.Node;
	packageDir: string;
}): TypeDefinitionCollector {
	const entries = new Map<string, TypeDefinition>();
	const keysByDeclaration = new Map<ts.Declaration, string>();
	const expandedDeclarations = new Set<ts.Declaration>();

	// Written annotations are real syntax, so the checker resolves their names. Nodes the checker
	// builds for a resolved type have no position to resolve from, so the node builder records each
	// name's symbol on the identifier itself.
	const resolveWritten: SymbolResolver = (name) => checker.getSymbolAtLocation(name);
	const resolveBuilt = resolveBuiltSymbol;

	// Printing follows the walk that registered every key, so each type name finds its definition.
	const typePrinter = createTypeTokenPrinter({
		keyFor(node) {
			if (ts.isIndexedAccessTypeNode(node)) {
				const key = indexedAccessKey(node);
				return key !== undefined && entries.has(key) ? key : undefined;
			}
			const name = referencedName(node);
			if (name === undefined) return;
			// Only nodes parsed from source have a position the checker can resolve from.
			const symbol = resolveBuilt(name) ?? (name.pos >= 0 ? resolveWritten(name) : undefined);
			const declaration =
				symbol === undefined ? undefined : namedTypeDeclaration(aliasTarget(symbol));
			return declaration === undefined ? undefined : keysByDeclaration.get(declaration);
		},
		sourceFile: enclosingDeclaration.getSourceFile(),
	});

	/**
	 * `expand: false` names external types without expanding them. `shown` marks names a row
	 * signature shows, which are expanded past `MAX_DEFINITIONS`.
	 */
	function visit(
		node: ts.Node,
		resolveSymbol: SymbolResolver,
		references: Array<string>,
		{ expand, shown }: { expand: boolean; shown: boolean },
	): void {
		if (ts.isIndexedAccessTypeNode(node) && resolveSymbol === resolveWritten) {
			const key = addIndexedAccess(node);
			if (key !== undefined) {
				addReference(references, key);
				return;
			}
		}

		const name = referencedName(node);
		const symbol = name === undefined ? undefined : resolveSymbol(name);
		const key = symbol === undefined ? undefined : addSymbol(symbol, { expand, shown });
		if (key !== undefined) {
			addReference(references, key);
			recordWrittenName(entries.get(key)!, name!.text);
		}

		ts.forEachChild(node, (child) => visit(child, resolveSymbol, references, { expand, shown }));
	}

	function addSymbol(
		symbol: ts.Symbol,
		{ expand, shown }: { expand: boolean; shown: boolean },
	): string | undefined {
		const target = aliasTarget(symbol);
		if (target.flags & ts.SymbolFlags.TypeParameter) return;
		// A library type such as `HTMLElement` stays built-in even where a package merges into it.
		if (target.declarations?.some((node) => isTypeScriptLib(node.getSourceFile().fileName))) return;

		const declaration = namedTypeDeclaration(target);
		if (declaration === undefined) return;

		const origin = declarationOrigin(declaration.getSourceFile().fileName, packageDir);
		if (origin === undefined) return;

		const existingKey = keysByDeclaration.get(declaration);
		const key = existingKey ?? uniqueKey(target.getName(), origin);
		if (existingKey === undefined) {
			keysByDeclaration.set(declaration, key);
			entries.set(key, {
				name: target.getName(),
				references: [],
				...(origin.kind === 'external' ? { module: origin.module, source: origin.source } : {}),
			});
		}

		// An external type found inside another external definition is named but not expanded.
		const shouldExpand = origin.kind === 'local' || expand;
		const withinBound = shown || entries.size <= MAX_DEFINITIONS;
		if (shouldExpand && withinBound && !expandedDeclarations.has(declaration)) {
			expandedDeclarations.add(declaration);
			expandDeclaration(key, declaration, origin);
		}
		return key;
	}

	function expandDeclaration(key: string, declaration: ts.Declaration, origin: Origin): void {
		const entry = entries.get(key)!;

		if (origin.kind === 'external') {
			if (!ts.isTypeAliasDeclaration(declaration)) return;

			visit(declaration.type, resolveWritten, entry.references, { expand: false, shown: false });
			removeReference(entry.references, key);
			const definition = typePrinter.declaration(declaration);
			if (
				typeTokensToText(definition, { multiline: false }).length > MAX_EXTERNAL_DEFINITION_LENGTH
			) {
				return;
			}
			entry.definition = definition;
			return;
		}

		ts.forEachChild(declaration, (child) =>
			visit(child, resolveWritten, entry.references, { expand: true, shown: false }),
		);
		removeReference(entry.references, key);
		entry.definition = typePrinter.declaration(declaration);

		if (!ts.isTypeAliasDeclaration(declaration) || declaration.typeParameters !== undefined) return;
		if (!containsOpaqueSyntax(declaration.type)) return;

		const type = checker.getTypeAtLocation(declaration.name);
		addResolved(entry, type, declaration, ts.NodeBuilderFlags.InTypeAlias);
	}

	function addIndexedAccess(node: ts.IndexedAccessTypeNode): string | undefined {
		if (!ts.isTypeReferenceNode(node.objectType)) return;
		if (!ts.isLiteralTypeNode(node.indexType) || !ts.isStringLiteral(node.indexType.literal))
			return;

		const name = referencedName(node.objectType);
		const symbol = name === undefined ? undefined : checker.getSymbolAtLocation(name);
		const target = symbol === undefined ? undefined : aliasTarget(symbol);
		const declaration = target === undefined ? undefined : namedTypeDeclaration(target);
		if (declaration === undefined) return;
		if (declarationOrigin(declaration.getSourceFile().fileName, packageDir)?.kind !== 'local') {
			return;
		}

		const key = indexedAccessKey(node)!;
		if (entries.has(key)) return key;

		const entry: TypeDefinition = { name: key, references: [] };
		addResolved(entry, checker.getTypeFromTypeNode(node), enclosingDeclaration);
		// Without an expansion the entry would say nothing, so the object type is walked instead.
		if (entry.resolved === undefined) return;

		entries.set(key, entry);
		return key;
	}

	function addResolved(
		entry: TypeDefinition,
		type: ts.Type,
		enclosing: ts.Node,
		extraFlags = ts.NodeBuilderFlags.None,
	): void {
		// The printed tokens and the walked references come from the same built node.
		const node = buildTypeNode(type, enclosing, PRINTED_TYPE_FLAGS | extraFlags);
		if (node === undefined) return;

		visit(node, resolveBuilt, entry.references, { expand: true, shown: false });
		entry.resolved = typePrinter.type(node);
	}

	/**
	 * The checker orders union members by type id, which depends on the order pages compile in.
	 * Sorting them keeps the printed text and the reference order the same on every build.
	 */
	function buildTypeNode(
		type: ts.Type,
		enclosing: ts.Node,
		flags: ts.NodeBuilderFlags,
	): ts.TypeNode | undefined {
		const node = checker.typeToTypeNode(type, enclosing, flags);
		if (node === undefined) return;

		const sourceFile = enclosing.getSourceFile();
		const { transformed } = ts.transform(node, [
			(context) => {
				const sortUnions = (child: ts.Node): ts.Node => {
					const visited = ts.visitEachChild(child, sortUnions, context);
					if (!ts.isUnionTypeNode(visited)) return visited;

					const members = visited.types.map((member) => ({
						member,
						text: printer.printNode(ts.EmitHint.Unspecified, member, sourceFile),
					}));
					members.sort(compareUnionMembers);
					return ts.factory.updateUnionTypeNode(
						visited,
						ts.factory.createNodeArray(members.map(({ member }) => member)),
					);
				};
				return (root) => ts.visitNode(root, sortUnions, ts.isTypeNode);
			},
		]);
		return transformed[0];
	}

	/** The key of a string-literal indexed access on a Luke UI type, such as `SprinklesProps['gap']`. */
	function indexedAccessKey(node: ts.IndexedAccessTypeNode): string | undefined {
		if (!ts.isTypeReferenceNode(node.objectType)) return;
		if (!ts.isLiteralTypeNode(node.indexType) || !ts.isStringLiteral(node.indexType.literal))
			return;
		const name = referencedName(node.objectType);
		if (name === undefined || name.pos < 0) return;
		const symbol = checker.getSymbolAtLocation(name);
		if (symbol === undefined) return;
		return `${aliasTarget(symbol).getName()}['${node.indexType.literal.text}']`;
	}

	function aliasTarget(symbol: ts.Symbol): ts.Symbol {
		return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
	}

	function uniqueKey(name: string, origin: Origin): string {
		if (!entries.has(name)) return name;

		const qualified = origin.kind === 'external' ? `${name} (${origin.module})` : `${name} (local)`;
		let key = qualified;
		for (let index = 2; entries.has(key); index++) key = `${qualified} ${index}`;
		return key;
	}

	return {
		addType(type, { omitUndefined }) {
			const built = buildTypeNode(type, enclosingDeclaration, PRINTED_TYPE_FLAGS);
			if (built === undefined) return;

			const node = omitUndefined ? withoutUndefined(built) : built;
			visit(node, resolveBuilt, [], { expand: true, shown: true });
			return typePrinter.type(node);
		},
		addTypeNode(node) {
			visit(node, resolveWritten, [], { expand: true, shown: true });
			return typePrinter.type(node);
		},
		definitions() {
			if (entries.size === 0) return;
			return Object.fromEntries(entries);
		},
	};
}

type Origin = { kind: 'external'; module: string; source: string } | { kind: 'local' };

/**
 * Where a declaration comes from. Luke UI covers the whole package, including generated files such
 * as `.generated/icon-data.ts`. Files that are neither Luke UI nor an installed package, such as
 * docs test fixtures and TypeScript's own library, give `undefined`.
 */
function declarationOrigin(fileName: string, packageDir: string): Origin | undefined {
	const normalized = resolve(fileName);
	if (isInsideDir(normalized, packageDir) && !normalized.includes(NODE_MODULES_SEGMENT)) {
		return { kind: 'local' };
	}
	if (isTypeScriptLib(fileName)) return;

	const index = normalized.lastIndexOf(NODE_MODULES_SEGMENT);
	if (index === -1) return;

	const packagePath = normalized
		.slice(index + NODE_MODULES_SEGMENT.length)
		.split(sep)
		.join('/');
	const module = (
		packagePath.startsWith('@')
			? SCOPED_PACKAGE_PATTERN.exec(packagePath)
			: UNSCOPED_PACKAGE_PATTERN.exec(packagePath)
	)?.[0];
	if (module === undefined) return;

	return { kind: 'external', module, source: packagePath.slice(module.length + 1) };
}

function isTypeScriptLib(fileName: string): boolean {
	return TYPESCRIPT_LIB_PATTERN.test(fileName);
}

function isInsideDir(filePath: string, dir: string): boolean {
	const relativePath = relative(resolve(dir), resolve(filePath));
	return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

function namedTypeDeclaration(symbol: ts.Symbol): ts.Declaration | undefined {
	return symbol.declarations?.find((node) => NAMED_TYPE_KINDS.has(node.kind));
}

/**
 * A built union without its `undefined` member, or its one remaining member. TypeScript adds
 * `undefined` to an optional prop's type, and the row's `?` already says it.
 */
function withoutUndefined(node: ts.TypeNode): ts.TypeNode {
	if (!ts.isUnionTypeNode(node)) return node;
	const members = node.types.filter((member) => member.kind !== ts.SyntaxKind.UndefinedKeyword);
	if (members.length === node.types.length) return node;
	if (members.length === 1) {
		const [member] = members;
		return ts.isParenthesizedTypeNode(member!) ? member.type : member!;
	}
	return ts.factory.updateUnionTypeNode(node, ts.factory.createNodeArray(members));
}

/** Keeps a name an import gives the type, such as `CSSProperties` for csstype's `Properties`. */
function recordWrittenName(entry: TypeDefinition, writtenName: string): void {
	if (writtenName === entry.name || entry.writtenAs?.includes(writtenName)) return;
	entry.writtenAs = [...(entry.writtenAs ?? []), writtenName];
}

/** The identifier a type reference, heritage clause, or qualified name points at. */
function referencedName(node: ts.Node): ts.Identifier | undefined {
	const name = (() => {
		if (ts.isTypeReferenceNode(node)) return node.typeName;
		if (ts.isExpressionWithTypeArguments(node)) return node.expression;
		return;
	})();
	if (name === undefined) return;
	if (ts.isIdentifier(name)) return name;
	if (ts.isQualifiedName(name)) return name.right;
	if (ts.isPropertyAccessExpression(name)) return name.name as ts.Identifier;
	return;
}

function containsOpaqueSyntax(node: ts.Node): boolean {
	if (OPAQUE_TYPE_KINDS.has(node.kind)) return true;
	return ts.forEachChild(node, (child) => containsOpaqueSyntax(child) || undefined) === true;
}

/** Numeric-aware text order, with `null` and `undefined` last as TypeScript prints them. */
function compareUnionMembers(a: { text: string }, b: { text: string }): number {
	const aNullish = NULLISH_TYPES.has(a.text);
	const bNullish = NULLISH_TYPES.has(b.text);
	if (aNullish !== bNullish) return aNullish ? 1 : -1;
	return a.text.localeCompare(b.text, 'en', { numeric: true });
}

function addReference(references: Array<string>, key: string): void {
	if (!references.includes(key)) references.push(key);
}

/** A recursive type names itself, which is not a reference a reader needs to follow. */
function removeReference(references: Array<string>, key: string): void {
	const index = references.indexOf(key);
	if (index !== -1) references.splice(index, 1);
}
