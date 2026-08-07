import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';

const contentDir = resolve(import.meta.dirname, '../../content/docs');
const examplesDir = resolve(import.meta.dirname, '../examples');

const SETTLED_THEMING_PAGES = [
	'theming',
	'applying-a-theme',
	'color',
	'authoring-a-theme',
	'token-reference',
];

const SUPERSEDED_THEMING_PAGES = [
	'theme-system',
	'theme',
	'color-mode',
	'spacing',
	'radius',
	'shadow',
];

function docsPagePath(slug: string): string {
	return resolve(contentDir, `${slug}.mdx`);
}

function readDocsPage(slug: string): string {
	return readFileSync(docsPagePath(slug), 'utf8');
}

function docsMetaPages(): Array<string> {
	const meta = JSON.parse(readFileSync(resolve(contentDir, 'meta.json'), 'utf8')) as {
		pages?: Array<string>;
	};
	return meta.pages ?? [];
}

function findAllMdxFiles(directory: string): Array<string> {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) return findAllMdxFiles(path);
		return extname(entry.name) === '.mdx' ? [path] : [];
	});
}

test('the settled theming pages exist', () => {
	for (const slug of SETTLED_THEMING_PAGES) {
		expect(existsSync(docsPagePath(slug))).toBe(true);
	}
});

test('the superseded theming pages no longer exist', () => {
	for (const slug of SUPERSEDED_THEMING_PAGES) {
		expect(existsSync(docsPagePath(slug))).toBe(false);
	}
});

test('the Theming navigation lists only the settled pages', () => {
	const pages = docsMetaPages();
	const start = pages.indexOf('---Theming---');
	const end = pages.indexOf('---Guides---');

	expect(start).toBeGreaterThanOrEqual(0);
	expect(end).toBeGreaterThan(start);
	expect(pages.slice(start + 1, end)).toEqual(SETTLED_THEMING_PAGES);
});

test('spacing, radius, and shadow live on the token reference', () => {
	const tokenReference = readDocsPage('token-reference');

	expect(tokenReference).toContain('## Choosing a scale');
	for (const example of ['overview/spacing-scale', 'overview/radius-roles', 'overview/depth']) {
		expect(tokenReference).toContain(`src="${example}"`);
	}
});

test('no rendered example applies a theme identity class', () => {
	// `themeClassName` is the export name every per-theme entrypoint
	// (`@luke-ui/react/themes/paper`, `@luke-ui/react/themes/tactile`) uses for its identity class,
	// and `tactileThemeClassName`/`paperThemeClassName` are the aliases docs code imports it under.
	// A rendered example using any of them would establish its own identity and nest one inside
	// the docs' own `<html>`-level identity.
	const identityClassNames = ['tactileThemeClassName', 'paperThemeClassName', 'themeClassName'];

	for (const file of findAllMdxFiles(contentDir)) {
		const contents = readFileSync(file, 'utf8');
		const examplePattern = /<ExampleBlock\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/g;

		for (const match of contents.matchAll(examplePattern)) {
			const src = match[1];
			if (src === undefined) continue;

			const examplePath = resolve(examplesDir, `${src}.tsx`);
			expect(existsSync(examplePath)).toBe(true);

			const exampleSource = readFileSync(examplePath, 'utf8');
			for (const className of identityClassNames) {
				expect(exampleSource).not.toContain(className);
			}
		}
	}
});
