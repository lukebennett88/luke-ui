import { ts } from 'ts-morph';
import { expect, test } from 'vite-plus/test';
import { createTypeTokenPrinter } from './print-type-tokens.js';
import { typeTokensToText } from './type-tokens.js';

const OPERATOR_GLUE_PATTERN = /[\u00a0\u2060]/;

/** Layouts follow React Aria's type renderer: lists longer than two items break, one per line. */
for (const { expected, name, source } of [
	{ expected: "'a' | 'b'", name: 'a two-member union', source: "'a' | 'b'" },
	{
		expected: "'a'\n  | 'b'\n  | 'c'",
		name: 'a longer union',
		source: "'a' | 'b' | 'c'",
	},
	{
		expected: "Wrap<'a'\n  | 'b'\n  | 'c'>",
		name: 'a long union inside inline type arguments',
		source: "Wrap<'a' | 'b' | 'c'>",
	},
	{
		expected: "{\n  size?: 'a'\n    | 'b'\n    | 'c';\n  readonly label: string;\n}",
		name: 'an object type, one member per line, nesting indentation',
		source: "{ size?: 'a' | 'b' | 'c'; readonly label: string }",
	},
	{
		expected: '(value: string, index: number) => void',
		name: 'a two-parameter function',
		source: '(value: string, index: number) => void',
	},
	{
		expected: '(\n  a: string,\n  b?: number,\n  ...rest: Array<boolean>\n) => void',
		name: 'a longer parameter list',
		source: '(a: string, b?: number, ...rest: Array<boolean>) => void',
	},
	{
		expected: "Value extends string ? 'text' :\nValue extends number ? 'count' : never",
		name: "a conditional type's nested else branch",
		source: "Value extends string ? 'text' : Value extends number ? 'count' : never",
	},
	{
		expected: '{\n  readonly [Key in Keys]?: Value;\n}',
		name: 'a mapped type',
		source: '{ readonly [Key in Keys]?: Value }',
	},
	{
		expected: "keyof typeof conditions | Holder['value'][]",
		name: 'type operators, queries, and indexed access',
		source: "keyof typeof conditions | Holder['value'][]",
	},
]) {
	test(`formats ${name}`, () => {
		expect(typeTokensToText(printType(source), { multiline: true })).toBe(expected);
	});
}

test('puts a formatted type on one line for table cells', () => {
	const tokens = printType(
		"{ size?: 'a' | 'b' | 'c'; label: (a: string, b: number, c: boolean) => void }",
	);

	expect(typeTokensToText(tokens, { multiline: false })).toBe(
		"{ size?: 'a' | 'b' | 'c'; label: (a: string, b: number, c: boolean) => void; }",
	);
	// The characters that keep `|` with its member are only for the browser's line wrapping.
	expect(typeTokensToText(tokens, { multiline: true })).not.toMatch(OPERATOR_GLUE_PATTERN);
});

test('classifies tokens and links the type names the definitions hold', () => {
	const tokens = printType("Responsive<'auto' | 4 | true | null> | Spacing['gap'] | Other", {
		Responsive: 'Responsive',
		"Spacing['gap']": "Spacing['gap']",
	});

	// Both unions have more than two members, so each breaks, the inner one a level deeper.
	expect(tokens).toEqual([
		['t', 'Responsive', 'Responsive'],
		'<',
		['s', "'auto'"],
		2,
		'|\u2060\u00a0',
		['l', '4'],
		2,
		'|\u2060\u00a0',
		['l', 'true'],
		2,
		'|\u2060\u00a0',
		['k', 'null'],
		'>',
		1,
		'|\u2060\u00a0',
		['t', "Spacing['gap']", "Spacing['gap']"],
		1,
		'|\u2060\u00a0',
		['t', 'Other'],
	]);
});

test('formats declarations with their type parameters and heritage', () => {
	const sourceFile = ts.createSourceFile(
		'declarations.ts',
		`export type Pair<First, Second extends string = 'b'> = [First, Second];
		export interface Props<Value> extends Base<Value>, Other {
			value: Value;
			onChange(value: Value): void;
		}`,
		ts.ScriptTarget.Latest,
		true,
	);
	const printer = createTypeTokenPrinter({ keyFor: () => undefined, sourceFile });
	const [alias, props] = sourceFile.statements as unknown as [ts.Declaration, ts.Declaration];

	expect(typeTokensToText(printer.declaration(alias), { multiline: true })).toBe(
		"type Pair<First, Second extends string = 'b'> = [First, Second];",
	);
	expect(typeTokensToText(printer.declaration(props), { multiline: true })).toBe(
		'interface Props<Value> extends Base<Value>, Other {\n  value: Value;\n  onChange(value: Value): void;\n}',
	);
});

/** Formats a type written in source, linking the names `keys` maps to definition keys. */
function printType(source: string, keys: Record<string, string> = {}) {
	const sourceFile = ts.createSourceFile(
		'type.ts',
		`type Printed = ${source};`,
		ts.ScriptTarget.Latest,
		true,
	);
	const [statement] = sourceFile.statements as unknown as [ts.TypeAliasDeclaration];
	const printer = createTypeTokenPrinter({
		keyFor: (node) => keys[node.getText(sourceFile)] ?? keys[referenceName(node)],
		sourceFile,
	});
	return printer.type(statement.type);
}

function referenceName(node: ts.Node): string {
	if (ts.isTypeReferenceNode(node)) return node.typeName.getText();
	return '';
}
