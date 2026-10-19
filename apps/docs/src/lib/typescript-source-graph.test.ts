import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import {
	collectTypescriptSourceGraph,
	hashTypescriptSourceGraph,
} from './typescript-source-graph.js';

test('resolves an extensionless directory import to its index file', () => {
	const root = mkdtempSync(join(tmpdir(), 'luke-source-graph-dir-'));
	try {
		mkdirSync(join(root, 'dep'), { recursive: true });
		writeFileSync(join(root, 'dep', 'index.ts'), 'export type Dep = string;\n');
		const entryPath = join(root, 'entry.ts');
		const entryContent = "import type { Dep } from './dep';\nexport type Entry = Dep;\n";
		writeFileSync(entryPath, entryContent);

		const graph = collectTypescriptSourceGraph(entryPath, entryContent);
		expect(graph.files).toContain(join(root, 'dep', 'index.ts'));
		expect(graph.files).not.toContain(join(root, 'dep'));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('source graph hash changes when a directory-imported module changes', () => {
	const root = mkdtempSync(join(tmpdir(), 'luke-source-graph-hash-'));
	try {
		mkdirSync(join(root, 'dep'), { recursive: true });
		const depPath = join(root, 'dep', 'index.ts');
		writeFileSync(depPath, 'export type Dep = string;\n');
		const entryPath = join(root, 'entry.ts');
		const entryContent = "import type { Dep } from './dep';\nexport type Entry = Dep;\n";
		writeFileSync(entryPath, entryContent);

		const before = hashTypescriptSourceGraph(entryPath, entryContent);
		writeFileSync(depPath, 'export type Dep = number;\n');
		expect(hashTypescriptSourceGraph(entryPath, entryContent)).not.toBe(before);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
