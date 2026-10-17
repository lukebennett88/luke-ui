import { ts } from 'ts-morph';
import type { TypeToken, TypeTokenKind } from './type-tokens.js';

export interface TypeTokenPrinter {
	/** Formats a declaration, such as `type Name<Value> = …;` or `interface Name { … }`. */
	declaration: (declaration: ts.Declaration) => Array<TypeToken>;
	/** Formats a type annotation or a type node the checker built. */
	type: (node: ts.TypeNode) => Array<TypeToken>;
}

const printer = ts.createPrinter({ removeComments: true });

/**
 * Joins a union or intersection operator to the member after it, as React Aria's type renderer
 * does, so a wrapped line starts with `| member` instead of ending with `|`. The no-break space
 * alone is not enough: Unicode allows a break after `|`, so a word joiner comes first.
 */
const OPERATOR_GLUE = '\u2060\u00a0';

const KEYWORD_KINDS = new Set([
	ts.SyntaxKind.AnyKeyword,
	ts.SyntaxKind.BigIntKeyword,
	ts.SyntaxKind.BooleanKeyword,
	ts.SyntaxKind.IntrinsicKeyword,
	ts.SyntaxKind.NeverKeyword,
	ts.SyntaxKind.NumberKeyword,
	ts.SyntaxKind.ObjectKeyword,
	ts.SyntaxKind.StringKeyword,
	ts.SyntaxKind.SymbolKeyword,
	ts.SyntaxKind.ThisType,
	ts.SyntaxKind.UndefinedKeyword,
	ts.SyntaxKind.UnknownKeyword,
	ts.SyntaxKind.VoidKeyword,
]);

/**
 * Lists longer than this break onto one line per item, as React Aria's type renderer does for
 * unions, intersections, parameters, and tuples. Shorter lists stay on one line.
 */
const MAX_INLINE_ITEMS = 2;

/**
 * Prints types as tokens with React Aria's layout: long lists put each later item on its own line,
 * object types put each member on its own line, and type arguments stay inline. `keyFor` gives the
 * definitions key of a type name, or of a whole indexed access such as `SprinklesProps['gap']`.
 */
export function createTypeTokenPrinter({
	keyFor,
	sourceFile,
}: {
	keyFor: (
		node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments | ts.IndexedAccessTypeNode,
	) => string | undefined;
	sourceFile: ts.SourceFile;
}): TypeTokenPrinter {
	/** A parsed node prints from its own file's text. A node the checker built has no file. */
	function text(node: ts.Node): string {
		const file = node.pos >= 0 ? node.getSourceFile() : sourceFile;
		return printer.printNode(ts.EmitHint.Unspecified, node, file);
	}

	function type(node: ts.TypeNode, depth: number): Array<TypeToken> {
		if (KEYWORD_KINDS.has(node.kind)) return [['k', text(node)]];

		switch (node.kind) {
			case ts.SyntaxKind.ParenthesizedType:
				return ['(', ...type((node as ts.ParenthesizedTypeNode).type, depth), ')'];
			case ts.SyntaxKind.UnionType:
				return list(
					(node as ts.UnionTypeNode).types,
					depth,
					` |${OPERATOR_GLUE}`,
					`|${OPERATOR_GLUE}`,
				);
			case ts.SyntaxKind.IntersectionType:
				return list(
					(node as ts.IntersectionTypeNode).types,
					depth,
					` &${OPERATOR_GLUE}`,
					`&${OPERATOR_GLUE}`,
				);
			case ts.SyntaxKind.TypeReference:
			case ts.SyntaxKind.ExpressionWithTypeArguments:
				return reference(node as ts.TypeReferenceNode | ts.ExpressionWithTypeArguments, depth);
			case ts.SyntaxKind.LiteralType:
				return [literal((node as ts.LiteralTypeNode).literal)];
			case ts.SyntaxKind.ArrayType:
				return [...type((node as ts.ArrayTypeNode).elementType, depth), '[]'];
			case ts.SyntaxKind.TupleType:
				return ['[', ...items((node as ts.TupleTypeNode).elements, depth, type), ']'];
			case ts.SyntaxKind.NamedTupleMember: {
				const member = node as ts.NamedTupleMember;
				return [
					member.dotDotDotToken === undefined ? '' : '...',
					['p', member.name.text],
					member.questionToken === undefined ? ': ' : '?: ',
					...type(member.type, depth),
				];
			}
			case ts.SyntaxKind.RestType:
				return ['...', ...type((node as ts.RestTypeNode).type, depth)];
			case ts.SyntaxKind.OptionalType:
				return [...type((node as ts.OptionalTypeNode).type, depth), '?'];
			case ts.SyntaxKind.FunctionType:
			case ts.SyntaxKind.ConstructorType: {
				const signature = node as ts.FunctionTypeNode | ts.ConstructorTypeNode;
				return [
					...(ts.isConstructorTypeNode(signature) ? [keyword('new'), ' '] : []),
					...typeParameters(signature.typeParameters, depth),
					...parameters(signature.parameters, depth),
					' => ',
					...type(signature.type, depth),
				];
			}
			case ts.SyntaxKind.TypeLiteral:
				return block((node as ts.TypeLiteralNode).members, depth);
			case ts.SyntaxKind.MappedType:
				return mapped(node as ts.MappedTypeNode, depth);
			case ts.SyntaxKind.TypeOperator: {
				const operator = node as ts.TypeOperatorNode;
				return [keyword(ts.tokenToString(operator.operator)!), ' ', ...type(operator.type, depth)];
			}
			case ts.SyntaxKind.IndexedAccessType: {
				const access = node as ts.IndexedAccessTypeNode;
				const key = keyFor(access);
				if (key !== undefined) return [['t', text(access), key]];
				return [...type(access.objectType, depth), '[', ...type(access.indexType, depth), ']'];
			}
			case ts.SyntaxKind.TypeQuery: {
				const query = node as ts.TypeQueryNode;
				return [
					keyword('typeof'),
					' ',
					text(query.exprName),
					...typeArguments(query.typeArguments, depth),
				];
			}
			case ts.SyntaxKind.ConditionalType:
				return conditional(node as ts.ConditionalTypeNode, depth);
			case ts.SyntaxKind.InferType: {
				const { typeParameter } = node as ts.InferTypeNode;
				return [keyword('infer'), ' ', ...typeParameterTokens(typeParameter, depth)];
			}
			case ts.SyntaxKind.TypePredicate: {
				const predicate = node as ts.TypePredicateNode;
				return [
					...(predicate.assertsModifier === undefined ? [] : [keyword('asserts'), ' ']),
					['p', text(predicate.parameterName)],
					...(predicate.type === undefined
						? []
						: [' ', keyword('is'), ' ', ...type(predicate.type, depth)]),
				];
			}
			case ts.SyntaxKind.TemplateLiteralType:
				return [['s', text(node)]];
			default:
				return [text(node)];
		}
	}

	/** Joins items inline, or puts each item after the first on its own line with `brokenJoiner`. */
	function list(
		nodes: ReadonlyArray<ts.TypeNode>,
		depth: number,
		inlineJoiner: string,
		brokenJoiner: string,
	): Array<TypeToken> {
		const breaks = nodes.length > MAX_INLINE_ITEMS;
		const memberDepth = breaks ? depth + 1 : depth;
		return nodes.flatMap((node, index) => {
			const printed = type(node, memberDepth);
			if (index === 0) return printed;
			return breaks ? [memberDepth, brokenJoiner, ...printed] : [inlineJoiner, ...printed];
		});
	}

	/** Comma-separated items that break onto indented lines, closing bracket on its own line, when long. */
	function items<Item>(
		nodes: ReadonlyArray<Item>,
		depth: number,
		print: (node: Item, depth: number) => Array<TypeToken>,
	): Array<TypeToken> {
		if (nodes.length <= MAX_INLINE_ITEMS) {
			return nodes.flatMap((node, index) => [
				...(index === 0 ? [] : [', ']),
				...print(node, depth),
			]);
		}
		return [
			...nodes.flatMap((node, index) => [
				...(index === 0 ? [] : [',']),
				depth + 1,
				...print(node, depth + 1),
			]),
			depth,
		];
	}

	function reference(
		node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
		depth: number,
	): Array<TypeToken> {
		const name = text(ts.isTypeReferenceNode(node) ? node.typeName : node.expression);
		const key = keyFor(node);
		return [
			key === undefined ? ['t', name] : ['t', name, key],
			...typeArguments(node.typeArguments, depth),
		];
	}

	/** Type arguments stay inline, as in React Aria. A long union inside one still breaks. */
	function typeArguments(
		nodes: ReadonlyArray<ts.TypeNode> | undefined,
		depth: number,
	): Array<TypeToken> {
		if (nodes === undefined || nodes.length === 0) return [];
		return [
			'<',
			...nodes.flatMap((node, index) => [...(index === 0 ? [] : [', ']), ...type(node, depth)]),
			'>',
		];
	}

	function typeParameters(
		nodes: ReadonlyArray<ts.TypeParameterDeclaration> | undefined,
		depth: number,
	): Array<TypeToken> {
		if (nodes === undefined || nodes.length === 0) return [];
		return [
			'<',
			...nodes.flatMap((node, index) => [
				...(index === 0 ? [] : [', ']),
				...typeParameterTokens(node, depth),
			]),
			'>',
		];
	}

	function typeParameterTokens(node: ts.TypeParameterDeclaration, depth: number): Array<TypeToken> {
		return [
			['t', node.name.text],
			...(node.constraint === undefined
				? []
				: [' ', keyword('extends'), ' ', ...type(node.constraint, depth)]),
			...(node.default === undefined ? [] : [' = ', ...type(node.default, depth)]),
		];
	}

	function parameters(
		nodes: ReadonlyArray<ts.ParameterDeclaration>,
		depth: number,
	): Array<TypeToken> {
		return ['(', ...items(nodes, depth, parameter), ')'];
	}

	function parameter(node: ts.ParameterDeclaration, depth: number): Array<TypeToken> {
		return [
			node.dotDotDotToken === undefined ? '' : '...',
			['p', text(node.name)],
			node.questionToken === undefined ? '' : '?',
			...(node.type === undefined ? [] : [': ', ...type(node.type, depth)]),
		];
	}

	/** An object type with each member on its own line. */
	function block(members: ReadonlyArray<ts.TypeElement>, depth: number): Array<TypeToken> {
		if (members.length === 0) return ['{}'];
		return [
			'{',
			...members.flatMap((member) => [depth + 1, ...typeElement(member, depth + 1), ';']),
			depth,
			'}',
		];
	}

	function typeElement(member: ts.TypeElement, depth: number): Array<TypeToken> {
		const optional = member.questionToken === undefined ? '' : '?';
		if (ts.isPropertySignature(member)) {
			const readonly = ts
				.getModifiers(member)
				?.some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword);
			return [
				...(readonly === true ? [keyword('readonly'), ' '] : []),
				propertyName(member.name),
				optional,
				...(member.type === undefined ? [] : [': ', ...type(member.type, depth)]),
			];
		}
		if (ts.isMethodSignature(member)) {
			return [
				propertyName(member.name),
				optional,
				...typeParameters(member.typeParameters, depth),
				...parameters(member.parameters, depth),
				...(member.type === undefined ? [] : [': ', ...type(member.type, depth)]),
			];
		}
		if (ts.isIndexSignatureDeclaration(member)) {
			return [
				'[',
				...items(member.parameters, depth, parameter),
				']: ',
				...type(member.type, depth),
			];
		}
		if (ts.isCallSignatureDeclaration(member) || ts.isConstructSignatureDeclaration(member)) {
			return [
				...(ts.isConstructSignatureDeclaration(member) ? [keyword('new'), ' '] : []),
				...typeParameters(member.typeParameters, depth),
				...parameters(member.parameters, depth),
				...(member.type === undefined ? [] : [': ', ...type(member.type, depth)]),
			];
		}
		return [text(member)];
	}

	function mapped(node: ts.MappedTypeNode, depth: number): Array<TypeToken> {
		const { typeParameter } = node;
		return [
			'{',
			depth + 1,
			...(node.readonlyToken === undefined
				? []
				: [modifierText(node.readonlyToken), keyword('readonly'), ' ']),
			'[',
			['t', typeParameter.name.text],
			' ',
			keyword('in'),
			' ',
			...(typeParameter.constraint === undefined ? [] : type(typeParameter.constraint, depth + 1)),
			...(node.nameType === undefined
				? []
				: [' ', keyword('as'), ' ', ...type(node.nameType, depth + 1)]),
			']',
			...(node.questionToken === undefined ? [] : [modifierText(node.questionToken), '?']),
			': ',
			...(node.type === undefined ? [keyword('unknown')] : type(node.type, depth + 1)),
			';',
			depth,
			'}',
		];
	}

	/** React Aria starts a conditional type's nested `else` branch on its own line. */
	function conditional(node: ts.ConditionalTypeNode, depth: number): Array<TypeToken> {
		return [
			...type(node.checkType, depth),
			' ',
			keyword('extends'),
			' ',
			...type(node.extendsType, depth),
			' ? ',
			...type(node.trueType, depth),
			ts.isConditionalTypeNode(node.falseType) ? ' :' : ' : ',
			...(ts.isConditionalTypeNode(node.falseType) ? [depth] : []),
			...type(node.falseType, depth),
		];
	}

	function literal(node: ts.LiteralTypeNode['literal']): TypeToken {
		if (node.kind === ts.SyntaxKind.NullKeyword) return keyword('null');
		return [ts.isStringLiteral(node) ? 's' : 'l', text(node)];
	}

	function propertyName(name: ts.PropertyName): TypeToken {
		return [ts.isStringLiteral(name) ? 's' : 'p', text(name)];
	}

	function declaration(node: ts.Declaration): Array<TypeToken> {
		if (ts.isTypeAliasDeclaration(node)) {
			return [
				keyword('type'),
				' ',
				['t', node.name.text],
				...typeParameters(node.typeParameters, 0),
				' = ',
				...type(node.type, 0),
				';',
			];
		}
		if (ts.isInterfaceDeclaration(node)) {
			const heritage = (node.heritageClauses ?? []).flatMap((clause) => clause.types);
			return [
				keyword('interface'),
				' ',
				['t', node.name.text],
				...typeParameters(node.typeParameters, 0),
				...(heritage.length === 0
					? []
					: [
							' ',
							keyword('extends'),
							' ',
							...heritage.flatMap((base, index) => [
								...(index === 0 ? [] : [', ']),
								...type(base, 0),
							]),
						]),
				' ',
				...block(node.members, 0),
			];
		}
		return [text(node)];
	}

	return {
		declaration: (node) => compact(declaration(node)),
		type: (node) => compact(type(node, 0)),
	};
}

/** Drops empty text and merges neighbouring punctuation, so the JSON stays small. */
function compact(tokens: ReadonlyArray<TypeToken>): Array<TypeToken> {
	const compacted: Array<TypeToken> = [];
	for (const token of tokens) {
		if (token === '') continue;
		const previous = compacted.at(-1);
		if (typeof token === 'string' && typeof previous === 'string') {
			compacted[compacted.length - 1] = previous + token;
			continue;
		}
		compacted.push(token);
	}
	return compacted;
}

function keyword(text: string): [TypeTokenKind, string] {
	return ['k', text];
}

function modifierText(token: ts.Node): string {
	if (token.kind === ts.SyntaxKind.PlusToken) return '+';
	if (token.kind === ts.SyntaxKind.MinusToken) return '-';
	return '';
}
