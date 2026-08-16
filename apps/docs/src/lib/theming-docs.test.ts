import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { findMdxFiles } from './docs-mdx-files.js';
import { exampleBlockSources } from './example-block-sources.js';

const allDocsContentDir = resolve(import.meta.dirname, '../../content/docs');
const examplesDir = resolve(import.meta.dirname, '../examples');

test('no rendered example applies a theme identity class', () => {
	// `themeClassName` is the export name every per-theme entrypoint
	// (`@luke-ui/react/themes/paper`, `@luke-ui/react/themes/tactile`) uses for its identity class,
	// and `tactileThemeClassName`/`paperThemeClassName` are the aliases docs code imports it under.
	// `getThemeClassName` derives one for an authored theme. A rendered example using any of them
	// would establish its own identity and nest one inside the docs' own `<html>`-level identity.
	const identityClassNames = [
		'tactileThemeClassName',
		'paperThemeClassName',
		'themeClassName',
		'getThemeClassName',
	];

	for (const file of findMdxFiles(allDocsContentDir)) {
		const contents = readFileSync(file, 'utf8');

		for (const src of exampleBlockSources(contents)) {
			const examplePath = resolve(examplesDir, `${src}.tsx`);
			expect(existsSync(examplePath)).toBe(true);

			const exampleSource = readFileSync(examplePath, 'utf8');
			for (const className of identityClassNames) {
				expect(exampleSource).not.toContain(className);
			}
		}
	}
});
