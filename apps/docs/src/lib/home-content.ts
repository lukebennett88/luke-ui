/** A homepage link card. */
export interface HomeLink {
	description: string;
	href: string;
	title: string;
}

/** A homepage feature. Backticks in `body` mark inline code. */
export interface HomeFeature {
	body: string;
	title: string;
}

export const HOME_TITLE = 'Luke UI';

export const HOME_INTRO =
	'Luke UI is a React design system built on React Aria Components. It ships static CSS, ' +
	'two bundled themes, and layout utilities that share a semantic token system.';

export const HOME_LINKS: Array<HomeLink> = [
	{
		description: 'Install Luke UI, apply a bundled theme, and render a component.',
		href: '/docs/installation',
		title: 'Installation',
	},
	{
		description: 'Browse the full component catalogue.',
		href: '/components',
		title: 'Components',
	},
];

export const HOME_FEATURES: Array<HomeFeature> = [
	{
		body:
			'Luke UI ships with two themes. Use `defineTheme` to create your own from a small set of ' +
			'colour, typography, radius, and depth choices, or extend a bundled theme. Generated ' +
			'themes include light and dark modes and are contrast-validated.',
		title: 'Custom themes',
	},
	{
		body:
			'Styles ship as static CSS with no runtime styling layer. Applying a theme does not ' +
			'require a React provider.',
		title: 'Static CSS',
	},
	{
		body:
			'Start with composed components, use exported primitives when you need more control, or ' +
			'use React Aria Components directly.',
		title: 'Composition at every level',
	},
	{
		body:
			'Async button actions manage their own pending state. Skeletons and spinners preserve the ' +
			'footprint of the content they replace.',
		title: 'Built-in loading states',
	},
	{
		body:
			'Use browser constraints, custom rules, controlled or server errors, or delegate ' +
			'validation to a form library.',
		title: 'Flexible validation',
	},
	{
		body:
			'Text is trimmed to its visible bounds, while heading levels can follow component ' +
			'structure automatically.',
		title: 'Structured typography',
	},
];

/** Renders the homepage copy as Markdown, for the `/index.md` agent twin. */
export function homeMarkdown(): string {
	const lines = [`# ${HOME_TITLE}`, '', HOME_INTRO, ''];

	for (const link of HOME_LINKS) {
		lines.push(`- [${link.title}](${link.href}): ${link.description}`);
	}
	lines.push('', '## Features', '');

	for (const [index, feature] of HOME_FEATURES.entries()) {
		lines.push(`### ${feature.title}`, '', feature.body);
		if (index < HOME_FEATURES.length - 1) lines.push('');
	}
	lines.push('');

	return lines.join('\n');
}
