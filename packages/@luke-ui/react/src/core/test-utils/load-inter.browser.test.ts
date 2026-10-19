import { expect, test } from 'vite-plus/test';
import { loadInter, resetLoadInterMemoForTests } from './load-inter.js';

test('loads the theme Inter file even when an unloaded Inter face is already registered', async () => {
	resetLoadInterMemoForTests();

	// Registered but never loaded: awaiting `.loaded` without `.load()` would hang forever.
	const stuck = new FontFace('Inter', 'url(data:font/woff2;base64,)', {
		style: 'normal',
		weight: '100 900',
	});
	document.fonts.add(stuck);
	expect(stuck.status).not.toBe('loaded');

	await expect(loadInter()).resolves.toBeUndefined();

	expect(stuck.status).not.toBe('loaded');
	expect(document.fonts.check('16px Inter')).toBe(true);
});
