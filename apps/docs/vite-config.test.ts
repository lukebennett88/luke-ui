import { expect, test } from 'vite-plus/test';
import { getPrerenderOptions, staticPrerenderPages } from './vite.config.js';

test('keeps required static outputs while serializing prerendering', () => {
	const prerender = getPrerenderOptions('/storybook');

	expect(staticPrerenderPages).toEqual([
		{ path: '/api/search' },
		{ path: '/llms.txt' },
		{ path: '/llms-full.txt' },
		{ path: '/playground/preview' },
	]);
	expect(prerender.concurrency).toBe(1);
	expect(prerender.filter({ path: '/playground/preview' })).toBe(true);
	expect(prerender.filter({ path: '/storybook/index.html' })).toBe(false);
});
