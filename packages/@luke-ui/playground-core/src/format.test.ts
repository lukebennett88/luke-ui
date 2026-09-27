import { expect, test } from 'vite-plus/test';
import { formatPlaygroundSource } from './format.js';

const TAB_OPTIONS = { useTabs: true } as const;

test('formats badly formatted valid TSX', async () => {
	const source = 'const foo=()=>{return <Button label="Foo"/>}';
	const formatted = await formatPlaygroundSource(source, TAB_OPTIONS);
	const expected = 'const foo = () => {\n\treturn <Button label="Foo" />;\n};\n';
	expect(formatted).toBe(expected);
});

test('applies the host style options', async () => {
	const source = 'const foo = { "a": 1 }';
	expect(await formatPlaygroundSource(source, { singleQuote: true })).toBe(
		'const foo = { a: 1 };\n',
	);
	expect(await formatPlaygroundSource(source, { quoteProps: 'preserve', semi: false })).toBe(
		'const foo = { "a": 1 }\n',
	);
});

test('returns an already formatted source unchanged', async () => {
	const source = 'const foo = () => {\n\treturn <Button label="Foo" />;\n};\n';
	const formatted = await formatPlaygroundSource(source, TAB_OPTIONS);
	expect(formatted).toBe(source);
});

test('returns null for incomplete TSX', async () => {
	const formatted = await formatPlaygroundSource('const incomplete = (', TAB_OPTIONS);
	expect(formatted).toBeNull();
});
