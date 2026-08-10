import { expect, test } from 'vite-plus/test';
import { getMarkdownPagePath } from './markdown-page-path.js';

test('maps a component guide to the guide Markdown URL', () => {
	expect(getMarkdownPagePath('components/actions/button.mdx')).toBe(
		'/components/actions/button.md',
	);
});

test('keeps the props segment in the props Markdown URL', () => {
	expect(getMarkdownPagePath('components/actions/button/props.mdx')).toBe(
		'/components/actions/button/props.md',
	);
});

test('collapses a genuine index page to its parent Markdown URL', () => {
	expect(getMarkdownPagePath('components/index.mdx')).toBe('/components.md');
});

test('maps a guide to its nested Markdown URL', () => {
	expect(getMarkdownPagePath('docs/installation.mdx')).toBe('/docs/installation.md');
});
