import { expect, test } from 'vite-plus/test';
import { resolvePageHeadMeta } from './page-head.js';

test('preserves the resolved page title', () => {
	expect(resolvePageHeadMeta({ description: null, title: 'Installation | Luke UI' })).toEqual([
		{ title: 'Installation | Luke UI' },
	]);
});

test('adds a description meta tag when the page has one', () => {
	expect(
		resolvePageHeadMeta({
			description: 'Install Luke UI, apply a bundled theme, and render a component.',
			title: 'Installation | Luke UI',
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

for (const description of [null, 'A labelled control for actions in an interface.']) {
	test(`adds Open Graph identity with description ${description}`, () => {
		const meta = resolvePageHeadMeta({
			description,
			title: 'Button | Luke UI',
			url: 'https://ui.lukebennett.dev/components/actions/button/',
		});
		expect(meta).toContainEqual({ content: 'website', property: 'og:type' });
		expect(meta).toContainEqual({ content: 'Button | Luke UI', property: 'og:title' });
		expect(meta).toContainEqual({
			content: 'https://ui.lukebennett.dev/components/actions/button/',
			property: 'og:url',
		});
		expect(meta.filter((tag) => 'property' in tag && tag.property === 'og:description')).toEqual(
			description ? [{ content: description, property: 'og:description' }] : [],
		);
	});
}
