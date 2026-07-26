import { expect, test } from 'vite-plus/test';
import { getStorybookStoryUrl } from './storybook.js';

test('links component folder indexes to their Storybook docs', () => {
	expect(getStorybookStoryUrl('components/actions/icon-button/index.mdx', '/')).toBe(
		'http://localhost:6006/?path=/docs/actions-iconbutton--docs',
	);
});

test('does not link component props pages to Storybook', () => {
	expect(getStorybookStoryUrl('components/actions/icon-button/props.mdx', '/')).toBeNull();
});
