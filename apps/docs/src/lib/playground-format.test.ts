import { expect, test } from 'vite-plus/test';
import { documentFormattingEdits, formatPlaygroundSource } from './playground-format.js';

test('formats badly formatted valid TSX', async () => {
	const source = 'const foo=()=>{return <Button label="Foo"/>}';
	const formatted = await formatPlaygroundSource(source);
	const expected = 'const foo = () => {\n\treturn <Button label="Foo" />;\n};\n';
	expect(formatted).toBe(expected);
});

test('returns no edit for already formatted source', async () => {
	const source = 'const foo = () => {\n\treturn <Button label="Foo" />;\n};\n';
	const formatted = await formatPlaygroundSource(source);
	expect(formatted).toBe(source);
});

test('returns no edit for incomplete TSX', async () => {
	const formatted = await formatPlaygroundSource('const incomplete = (');
	expect(formatted).toBeNull();
});

test('document formatting edits are empty when output is unchanged', () => {
	const source = 'const foo = (x) => x;\n';
	const range = {
		startLineNumber: 1,
		startColumn: 1,
		endLineNumber: 1,
		endColumn: source.length + 1,
	};
	expect(documentFormattingEdits(source, source, range)).toEqual([]);
});

test('document formatting edits replace the full model when formatting changes source', () => {
	const source = 'const foo = (x)=>x';
	const expected = 'const foo = (x) => x;\n';
	const range = {
		startLineNumber: 1,
		startColumn: 1,
		endLineNumber: 1,
		endColumn: source.length + 1,
	};
	expect(documentFormattingEdits(source, expected, range)).toEqual([{ range, text: expected }]);
});
