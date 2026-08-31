import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import {
	docsPageFile,
	getMarkdownPagePath,
	markdownUrlForPage,
	slugsFromMarkdownRequest,
} from './markdown-page-path.js';

test('maps a component guide to the guide Markdown URL', () => {
	expect(getMarkdownPagePath('components/actions/button.mdx')).toBe(
		'/components/actions/button.md',
	);
});

test('collapses a genuine index page to its parent Markdown URL', () => {
	expect(getMarkdownPagePath('components/index.mdx')).toBe('/components.md');
});

test('maps a guide to its nested Markdown URL', () => {
	expect(getMarkdownPagePath('docs/installation.mdx')).toBe('/docs/installation.md');
});

test('maps a page URL to the Markdown download path', () => {
	expect(markdownUrlForPage('/')).toBe('/index.md');
	expect(markdownUrlForPage('/components/actions/button')).toBe('/components/actions/button.md');
});

test('treats /index.md as the landing page slugs', () => {
	expect(slugsFromMarkdownRequest('index')).toEqual([]);
	expect(slugsFromMarkdownRequest('components/actions/button')).toEqual([
		'components',
		'actions',
		'button',
	]);
});

test('resolves a docs pathname to an MDX file under a content directory', () => {
	const directory = mkdtempSync(join(tmpdir(), 'luke-ui-markdown-page-path-'));
	try {
		mkdirSync(join(directory, 'components', 'actions'), { recursive: true });
		writeFileSync(join(directory, 'components', 'actions', 'button.mdx'), '# Button\n');

		expect(docsPageFile(directory, '/components/actions/button')).toBe(
			join(directory, 'components', 'actions', 'button.mdx'),
		);
		expect(docsPageFile(directory, '/')).toBeNull();
		expect(docsPageFile(directory, '/missing')).toBeNull();
	} finally {
		rmSync(directory, { force: true, recursive: true });
	}
});
