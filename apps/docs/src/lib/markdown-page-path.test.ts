import { expect, test } from 'vite-plus/test';
import { getMarkdownPagePath } from './markdown-page-path.js';

test('maps a component folder index to the guide Markdown URL', () => {
	expect(getMarkdownPagePath('components/actions/button/index.mdx')).toBe(
		'/components/actions/button.md',
	);
});

test('keeps the props segment in the props Markdown URL', () => {
	expect(getMarkdownPagePath('components/actions/button/props.mdx')).toBe(
		'/components/actions/button/props.md',
	);
});
