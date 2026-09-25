/**
 * Markdown copy of the homepage for the `/index.md` agent twin. It mirrors
 * `HomeHero` and `HomeFeatures`, minus the interactive demo panel.
 * `home-markdown.browser.test.tsx` fails when the rendered homepage text drifts
 * from this copy.
 */

/** The homepage lead sentence, also used as the `/llms.txt` summary. */
export const HOME_INTRO = 'Luke UI is a React design system built on React Aria Components.';

const INSTALL_COMMAND = 'pnpm add @luke-ui/react react-aria-components';

const LINKS = [
	{ href: '/docs/installation', title: 'Installation' },
	{ href: '/components', title: 'Components' },
] as const;

// Backticks mark inline code, rendered with `<Code>` on the homepage.
const FEATURES = [
	{
		description:
			'Luke UI includes two themes. To make your own, pass colour, typography, radius, and depth ' +
			'choices to `defineTheme`, or extend a bundled theme. Each generated theme has light and ' +
			'dark modes and passes contrast checks.',
		title: 'Themes',
	},
	{
		description:
			'Styles are static CSS with no runtime styling. You can apply a theme without a React ' +
			'provider.',
		title: 'Static CSS',
	},
	{
		description:
			'Use composed components, use the exported primitives when you need more control, or use ' +
			'React Aria Components directly.',
		title: 'Components and primitives',
	},
	{
		description:
			'Buttons with async actions manage their own pending state. Skeletons and spinners keep ' +
			'the size of the content they replace.',
		title: 'Loading states',
	},
	{
		description:
			'Validate with browser constraints, custom rules, or controlled and server errors, or hand ' +
			'validation to a form library.',
		title: 'Validation',
	},
	{
		description:
			'Text is trimmed to its visible bounds. Heading levels can follow component structure ' +
			'automatically.',
		title: 'Typography',
	},
] as const;

/** Renders the homepage copy as Markdown. */
export function homeMarkdown(): string {
	const lines = ['# Luke UI', '', HOME_INTRO, ''];

	for (const link of LINKS) {
		lines.push(`- [${link.title}](${link.href})`);
	}
	lines.push('', '```sh', INSTALL_COMMAND, '```', '', '## Features');

	for (const feature of FEATURES) {
		lines.push('', `### ${feature.title}`, '', feature.description);
	}
	lines.push('');

	return lines.join('\n');
}
