import { expect, test } from 'vite-plus/test';
import { HOME_FEATURES, homeMarkdown } from './home-content.js';

test('opens with the Luke UI heading', () => {
	expect(homeMarkdown().startsWith('# Luke UI\n')).toBe(true);
});

test('includes a Features heading and every feature as an h3', () => {
	const body = homeMarkdown();
	expect(body).toContain('## Features');
	for (const feature of HOME_FEATURES) {
		expect(body).toContain(`### ${feature.title}`);
	}
});

test('preserves backticks in feature bodies', () => {
	const body = homeMarkdown();
	expect(body).toContain('`defineTheme`');
});
