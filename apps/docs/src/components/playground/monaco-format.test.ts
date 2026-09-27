import { expect, test } from 'vite-plus/test';
import { documentFormattingEdits } from './monaco-format.js';

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
