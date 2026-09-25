/** A concise agent-facing summary of the homepage for the `/index.md` twin. */

/** The homepage lead sentence, also used as the `/llms.txt` summary. */
export const HOME_INTRO = 'Luke UI is a React design system built on React Aria Components.';

const INSTALL_COMMAND = 'pnpm add @luke-ui/react react-aria-components';

const FEATURES = [
	'Themes: two bundled themes, or make your own with `defineTheme`. Each has light and dark modes and passes contrast checks.',
	'Static CSS: no runtime styling, and no React provider needed to apply a theme.',
	'Components and primitives: use composed components, the exported primitives, or React Aria Components directly.',
	'Loading states: buttons with async actions manage their own pending state, and skeletons and spinners keep the size of the content they replace.',
	'Validation: browser constraints, custom rules, controlled or server errors, or a form library.',
	'Typography: text is trimmed to its visible bounds, and heading levels can follow component structure.',
];

/** Renders a short Markdown summary of the homepage. */
export function homeMarkdown(): string {
	return [
		'# Luke UI',
		'',
		HOME_INTRO,
		'',
		'- [Installation](/docs/installation)',
		'- [Components](/components)',
		'',
		'```sh',
		INSTALL_COMMAND,
		'```',
		'',
		'## Features',
		'',
		...FEATURES.map((feature) => `- ${feature}`),
		'',
	].join('\n');
}
