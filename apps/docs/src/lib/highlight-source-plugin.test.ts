import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { describe, expect, test } from 'vite-plus/test';
import { encodeDocsPlaygroundHash } from '../playground/docs-playground-hash.js';
import { highlightSourcePlugin } from './highlight-source-plugin.js';
import type { HighlightedSource } from './highlighted-source.js';

describe('highlightSourcePlugin', () => {
	test('loads a highlighted source module for the highlight query', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'luke-ui-highlight-source-'));
		const path = join(directory, 'example.tsx');
		const source = '\n\tconst example = <div>Hello</div>;\n';

		try {
			await writeFile(path, source);

			const highlighted = await loadHighlightedSource(path);

			expect(highlighted.html).toContain('<code');
			expect(highlighted.html).not.toContain('<pre');
			expect(highlighted.html).toContain('--shiki-light');
			expect(highlighted.html).toContain('--shiki-dark');
			expect(highlighted.source).toBe(source.trim());
			expect(highlighted.playgroundHash).toBe(encodeDocsPlaygroundHash(source.trim()));
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});

	test('highlights a Vanilla Extract sample instead of compiling it', async () => {
		const loaders = Object.values(
			import.meta.glob<HighlightedSource>('../samples/*/*.css.ts', {
				import: 'default',
				query: '?highlight',
			}),
		);
		expect(loaders).not.toHaveLength(0);

		for (const highlighted of await Promise.all(loaders.map((load) => load()))) {
			expect(highlighted).toMatchObject({
				source: expect.stringContaining("from '@vanilla-extract/css'"),
			});
		}
	});

	test('sets playgroundHash to null when an import is not in the playground scope', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'luke-ui-highlight-source-'));
		const path = join(directory, 'example.tsx');
		const source = "import { DecorativeBox } from './decorative-box.js';\n";

		try {
			await writeFile(path, source);

			const highlighted = await loadHighlightedSource(path);

			expect(highlighted.playgroundHash).toBeNull();
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});
});

async function loadHighlightedSource(path: string): Promise<HighlightedSource> {
	const { load, resolveId } = highlightSourcePlugin();
	if (typeof resolveId !== 'function') throw new Error('Expected a plugin resolveId hook');
	if (typeof load !== 'function') throw new Error('Expected a plugin load hook');

	const resolver = { resolve: async (source: string) => ({ id: source }) };
	const id = await resolveId.call(resolver as never, `${path}?highlight`, undefined, {} as never);
	if (typeof id !== 'string') throw new Error('Expected a resolved module ID');

	const module = await load.call({ addWatchFile() {} } as never, id);
	if (typeof module !== 'string') throw new Error('Expected a JavaScript module');

	return JSON.parse(module.slice('export default '.length, -';\n'.length)) as HighlightedSource;
}
