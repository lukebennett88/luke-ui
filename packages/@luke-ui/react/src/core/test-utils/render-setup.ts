// Built components require the built stylesheet's class names and layer order.
import '@luke-ui/react/stylesheet.css';
import { afterEach, beforeEach } from 'vite-plus/test';
import { installFixtureThemes } from './fixture-themes.js';
import { loadInter } from './load-inter.js';
import { DESKTOP_SCREEN_WIDTH, mockScreenWidth } from './mock-screen-width.js';
import { cleanupMountedRenders } from './render-mount-state.js';
import { parkPointer } from './visual.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

installFixtureThemes();

beforeEach(async () => {
	mockScreenWidth(DESKTOP_SCREEN_WIDTH);
	// Load the theme Inter file before mount so the first paint uses real metrics, not a fallback.
	await loadInter();
});

afterEach(async () => {
	cleanupMountedRenders();
	await parkPointer();
});
