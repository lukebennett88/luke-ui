import { expect, test } from 'vite-plus/test';
import { findStoryPlayViolations } from './check-story-plays.js';

test('rejects assertions in inline and referenced play functions', () => {
	const violations = findStoryPlayViolations([
		{
			file: 'button.stories.tsx',
			source: `
				const checkInteraction = async (context) => {
					await expect(context.canvas.getByRole('button')).toBeVisible();
				};
				export const Example = {
					play: checkInteraction,
				};
			`,
		},
		{
			file: 'link.stories.tsx',
			source: `
				const Example = {
					play: async (context) => {
						await context.canvas.getByRole('link');
					},
				};
			`,
		},
		{
			file: 'text.stories.tsx',
			source: `
				// expect(context) in a comment is not an assertion.
				const Example = {
					play: checkInteraction,
				};
				const checkInteraction = async (context) => context.canvas.getByText('Text');
			`,
		},
	]);

	expect(violations).toEqual([{ file: 'button.stories.tsx', line: 6 }]);
});
