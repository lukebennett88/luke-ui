import { expect, test } from 'vite-plus/test';
import { getStorybookStoryUrl } from './storybook.js';

test('links component guides to their Storybook docs', () => {
	expect(
		getStorybookStoryUrl(
			'components/actions/icon-button.mdx',
			'/',
			'packages/@luke-ui/react/src/exports/icon-button.ts',
		),
	).toBe('http://localhost:6006/?path=/docs/actions-iconbutton--docs');
});

test('does not link component-shaped pages with no source frontmatter', () => {
	expect(getStorybookStoryUrl('components/forms/topic.mdx', '/')).toBeNull();
});
