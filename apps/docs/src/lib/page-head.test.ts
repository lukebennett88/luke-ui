import { expect, test } from 'vite-plus/test';
import { resolvePageHeadMeta } from './page-head.js';

test('titles a page with its frontmatter title and the site suffix', () => {
	expect(resolvePageHeadMeta({ description: null, title: 'Installation' })).toEqual([
		{ title: 'Installation | Luke UI' },
	]);
});

test('adds a description meta tag when the page has one', () => {
	expect(
		resolvePageHeadMeta({
			description: 'Install Luke UI, apply a bundled theme, and render a component.',
			title: 'Installation',
		}),
	).toEqual([
		{ title: 'Installation | Luke UI' },
		{
			content: 'Install Luke UI, apply a bundled theme, and render a component.',
			name: 'description',
		},
	]);
});

test('returns no meta entries before the loader has resolved', () => {
	expect(resolvePageHeadMeta(undefined)).toEqual([]);
});
