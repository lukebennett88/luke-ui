import { format as oxfmtFormat } from 'oxfmt';
import { expect, test } from 'vite-plus/test';
import {
	createOxfmtFormattingProvider,
	formatPlaygroundSource,
	toPlaygroundWasmFmtConfig,
} from './playground-format.js';
import { repoFmtOptions } from './repo-fmt-options.js';

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
	const formatted = await formatPlaygroundSource(source);
	expect(formatted).toBe(expected);
});

test('already formatted TSX produces identical output', async () => {
	const source = await formatWithRepoOxfmt('const foo = (x)=>x');
	const formatted = await formatPlaygroundSource(source);
	expect(formatted).toBe(source);
});

test('incomplete TSX produces no destructive edit', async () => {
	const source = 'const incomplete = (';
	const formatted = await formatPlaygroundSource(source);
	expect(formatted).toBeNull();
});

test('representative repository options shape round-trips to wasm config', () => {
	const wasmConfig = toPlaygroundWasmFmtConfig();
	expect(wasmConfig.singleQuote).toBe(true);
	expect(wasmConfig.indentStyle).toBe('tab');
	expect(wasmConfig.lineWidth).toBe(100);
	expect(wasmConfig.arrowParens).toBe('always');
	expect(wasmConfig.sortImports?.sortSideEffects).toBe(true);
});

test('sorts imports like repository Oxfmt', async () => {
	const source = 'import React from "react";\nimport { Button } from "@luke-ui/react/button";';
	const expected = await formatWithRepoOxfmt(source);
	const formatted = await formatPlaygroundSource(source);
	expect(formatted).toBe(expected);
});

test('document formatting provider returns no edits when output is unchanged', async () => {
	const source = await formatWithRepoOxfmt('const foo = (x)=>x');
	const model = {
		getValue: () => source,
		getFullModelRange: () => ({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: 1,
			endColumn: source.length + 1,
		}),
	};
	const edits = await createOxfmtFormattingProvider().provideDocumentFormattingEdits(
		model as never,
		{} as never,
		{} as never,
	);
	expect(edits).toEqual([]);
});

test('document formatting provider returns a full-model edit when formatting changes source', async () => {
	const source = 'const foo = (x)=>x';
	const expected = await formatWithRepoOxfmt(source);
	const model = {
		getValue: () => source,
		getFullModelRange: () => ({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: 1,
			endColumn: source.length + 1,
		}),
	};
	const edits = await createOxfmtFormattingProvider().provideDocumentFormattingEdits(
		model as never,
		{} as never,
		{} as never,
	);
	expect(edits).toEqual([{ range: model.getFullModelRange(), text: expected }]);
});
