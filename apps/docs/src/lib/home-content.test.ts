import { expect, test } from 'vite-plus/test';
import { HOME_INTRO, homeMarkdown } from './home-content.js';

test('opens with the Luke UI heading and the lead sentence', () => {
	expect(homeMarkdown().startsWith(`# Luke UI\n\n${HOME_INTRO}\n`)).toBe(true);
});

test('links to Installation', () => {
	expect(homeMarkdown()).toContain('- [Installation](/docs/installation)');
});
