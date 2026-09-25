import { expect, test } from 'vite-plus/test';
import { HOME_INTRO, homeMarkdown } from './home-content.js';

test('opens with the Luke UI heading and the lead sentence', () => {
	expect(homeMarkdown().startsWith(`# Luke UI\n\n${HOME_INTRO}\n`)).toBe(true);
});

test('lists the Installation and Components links', () => {
	const body = homeMarkdown();
	expect(body).toContain('- [Installation](/docs/installation)\n- [Components](/components)\n');
});

test('puts the install command in a shell code block', () => {
	expect(homeMarkdown()).toContain('```sh\npnpm add @luke-ui/react react-aria-components\n```\n');
});

test('lists every feature as an h3 under a Features h2', () => {
	const body = homeMarkdown();
	const featuresIndex = body.indexOf('\n## Features\n');
	expect(featuresIndex).toBeGreaterThan(-1);

	const featureHeadings = body
		.slice(featuresIndex)
		.split('\n')
		.filter((line) => line.startsWith('### '));
	expect(featureHeadings).toEqual([
		'### Themes',
		'### Static CSS',
		'### Components and primitives',
		'### Loading states',
		'### Validation',
		'### Typography',
	]);
});

test('marks inline code with backticks', () => {
	expect(homeMarkdown()).toContain('`defineTheme`');
});
