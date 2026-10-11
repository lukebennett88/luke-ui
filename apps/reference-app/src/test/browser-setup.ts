import { getThemeClassName } from '@luke-ui/react/theme';
import { afterEach, beforeEach, vi } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { settingsApi } from '../api/settings-api.js';
import { referenceThemeInput } from '../theme/input.js';
import { cleanupApps } from './render-app.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// `index.html` carries the identity class in the app. Tests render without it.
document.documentElement.classList.add(getThemeClassName(referenceThemeInput.name));

beforeEach(async () => {
	settingsApi.reset();
	settingsApi.setLatency(0);
	await page.viewport(1280, 800);
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: 'light' }],
	});
});

afterEach(async () => {
	cleanupApps();
	vi.restoreAllMocks();
	settingsApi.reset();
	for (const name of [
		'data-color-mode',
		'data-font-size',
		'data-pointer-cursor',
		'data-underline-links',
	]) {
		document.documentElement.removeAttribute(name);
	}
	await page.viewport(1280, 800);
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: 'light' }],
	});
});
