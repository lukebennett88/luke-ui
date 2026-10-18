// Built components require the built stylesheet's class names and layer order.
import '@luke-ui/react/stylesheet.css';
import { afterEach, beforeEach } from 'vite-plus/test';
import { installFixtureThemes } from './fixture-themes.js';
import { loadVisualFonts, pinCodeFamily } from './load-inter.js';
import { DESKTOP_SCREEN_WIDTH, mockScreenWidth } from './mock-screen-width.js';
import { cleanupMountedRenders } from './render-mount-state.js';
import { parkPointer } from './visual.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

installFixtureThemes();

let restoreCodeFamily: (() => void) | undefined;

beforeEach(async () => {
	mockScreenWidth(DESKTOP_SCREEN_WIDTH);
	// Pin Inter and the theme code family before mount so fixtures and overlays measure against
	// the same faces the screenshot will use. `captureVisual` may pin again (refcount) as a safety
	// net. Theme authoring tests that assert the production code stack read it from generated CSS.
	await loadVisualFonts();
	restoreCodeFamily = pinCodeFamily();
});

afterEach(async () => {
	cleanupMountedRenders();
	restoreCodeFamily?.();
	restoreCodeFamily = undefined;
	await parkPointer();
});
