/** The homepage copy, shared by the page and its `/index.md` twin. */

/** The homepage lead sentence, also used as the `/llms.txt` summary. */
export const HOME_INTRO = 'Luke UI is a React design system built on React Aria Components.';

export const INSTALL_COMMAND = 'pnpm add @luke-ui/react react-aria-components';

interface HomeSection {
	description: string;
	href: string;
	title: string;
}

/** The sections the homepage links to, in reading order. */
export const HOME_SECTIONS: ReadonlyArray<HomeSection> = [
	{
		description: 'Install Luke UI and a theme, and render a component.',
		href: '/docs/installation',
		title: 'Installation',
	},
	{
		description: 'Composition, styling, layout, typography, and icons.',
		href: '/docs/composition',
		title: 'Foundations',
	},
	{
		description: 'Apply a bundled theme, choose colour modes, or author your own.',
		href: '/docs/theming',
		title: 'Theming',
	},
	{
		description: 'Build forms with browser validation, React Hook Form, or TanStack Form.',
		href: '/docs/forms',
		title: 'Forms',
	},
	{
		description: 'Composed components, layout utilities, and the primitives beneath them.',
		href: '/components',
		title: 'Components',
	},
	{
		description: 'Edit an example and preview it in either theme.',
		href: '/playground',
		title: 'Playground',
	},
];

/** Renders a short Markdown summary of the homepage. */
export function homeMarkdown(): string {
	return [
		'# Luke UI',
		'',
		HOME_INTRO,
		'',
		'```sh',
		INSTALL_COMMAND,
		'```',
		'',
		...HOME_SECTIONS.map(
			(section) => `- [${section.title}](${section.href}): ${section.description}`,
		),
		'',
	].join('\n');
}
