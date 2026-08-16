import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { describe, expect, test } from 'vite-plus/test';
import { highlightSourcePlugin } from './highlight-source-plugin.js';
import type { HighlightedSource } from './highlighted-source.js';
import { encodeCodeHash } from './playground-hash.js';

describe('highlightSourcePlugin', () => {
	test('loads a highlighted source module for the highlight query', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'luke-ui-highlight-source-'));
		const path = join(directory, 'example.tsx');
		const source = '\n\tconst example = <div>Hello</div>;\n';

		try {
			await writeFile(path, source);

			const load = highlightSourcePlugin().load;
			if (typeof load !== 'function') throw new Error('Expected a plugin load hook');

			const module = await load.call({} as never, `${path}?highlight`);
			if (typeof module !== 'string') throw new Error('Expected a JavaScript module');

			const highlighted = JSON.parse(
				module.slice('export default '.length, -';\n'.length),
			) as HighlightedSource;

			expect(highlighted.html).toContain('<code');
			expect(highlighted.html).not.toContain('<pre');
			expect(highlighted.html).toContain('--shiki-light');
			expect(highlighted.html).toContain('--shiki-dark');
			expect(highlighted.playgroundHash).toBe(encodeCodeHash(source.trim()));
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});

	test('sets playgroundHash to null when an import is not in the playground scope', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'luke-ui-highlight-source-'));
		const path = join(directory, 'example.tsx');
		const source = "import { DecorativeBox } from './decorative-box.js';\n";

		try {
			await writeFile(path, source);

			const load = highlightSourcePlugin().load;
			if (typeof load !== 'function') throw new Error('Expected a plugin load hook');

			const module = await load.call({} as never, `${path}?highlight`);
			if (typeof module !== 'string') throw new Error('Expected a JavaScript module');

			const highlighted = JSON.parse(
				module.slice('export default '.length, -';\n'.length),
			) as HighlightedSource;

			expect(highlighted.playgroundHash).toBeNull();
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});
});
