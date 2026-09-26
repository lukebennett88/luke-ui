import { readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { canRunInPlayground } from '@luke-ui/playground-core';
import { expect, test } from 'vite-plus/test';
import { docsPlaygroundSpecifiers } from './docs-playground-specifiers.js';

const specifiers = docsPlaygroundSpecifiers();

test('documented examples that the playground cannot resolve use unsupported relative imports', () => {
	const docsDir = resolve(import.meta.dirname, '../../content/docs');
	const examplesDir = resolve(import.meta.dirname, '../examples');
	const unrunnable = documentedExampleSources(docsDir)
		.filter((src) => {
			const source = readFileSync(resolve(examplesDir, `${src}.tsx`), 'utf8');
			return !canRunInPlayground(source, specifiers);
		})
		.sort();

	expect(unrunnable).toEqual(['overview/concentric-radius', 'overview/radius-roles']);
});

function documentedExampleSources(docsDir: string): Array<string> {
	const sources = new Set<string>();
	const exampleBlockPattern = /<ExampleBlock\b[\s\S]*?\bsrc=["']([^"']+)["']/g;

	for (const file of findMdxFiles(docsDir)) {
		const contents = readFileSync(file, 'utf8');
		for (const match of contents.matchAll(exampleBlockPattern)) {
			const src = match[1];
			if (src !== undefined) sources.add(src);
		}
	}

	return [...sources];
}

function findMdxFiles(directory: string): Array<string> {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) return findMdxFiles(path);
		return extname(entry.name) === '.mdx' ? [path] : [];
	});
}
