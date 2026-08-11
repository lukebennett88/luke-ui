import { format as oxfmtFormat } from 'oxfmt';
import { expect, test } from 'vite-plus/test';
import { repoFmtOptions } from '../../../../tooling/fmt-options.js';
import { formatPlaygroundSourceWithOxfmt } from './format-playground-source.js';
import { documentFormattingEdits } from './playground-format.js';

const oxfmtOpts = {
	...repoFmtOptions,
	proseWrap: 'always' as const,
};

async function formatWithRepoOxfmt(source: string): Promise<string> {
	const { code } = await oxfmtFormat('index.tsx', source, oxfmtOpts);
	return code;
}

test('badly formatted valid TSX matches repository Oxfmt output', async () => {
	const source = 'const foo = (x)=>x';
	const expected = await formatWithRepoOxfmt(source);
	const formatted = await formatPlaygroundSourceWithOxfmt(source);
	expect(formatted).toBe(expected);
});

test('already formatted TSX produces identical output', async () => {
	const source = await formatWithRepoOxfmt('const foo = (x)=>x');
	const formatted = await formatPlaygroundSourceWithOxfmt(source);
	expect(formatted).toBe(source);
});

test('incomplete TSX produces no formatted output', async () => {
	const formatted = await formatPlaygroundSourceWithOxfmt('const incomplete = (');
	expect(formatted).toBeNull();
});

test('sorts imports like repository Oxfmt', async () => {
	const source = 'import React from "react";\nimport { Button } from "@luke-ui/react/button";';
	const expected = await formatWithRepoOxfmt(source);
	const formatted = await formatPlaygroundSourceWithOxfmt(source);
	expect(formatted).toBe(expected);
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

test('document formatting edits replace the full model when formatting changes source', async () => {
	const source = 'const foo = (x)=>x';
	const expected = await formatWithRepoOxfmt(source);
	const range = {
		startLineNumber: 1,
		startColumn: 1,
		endLineNumber: 1,
		endColumn: source.length + 1,
	};
	expect(documentFormattingEdits(source, expected, range)).toEqual([{ range, text: expected }]);
});
