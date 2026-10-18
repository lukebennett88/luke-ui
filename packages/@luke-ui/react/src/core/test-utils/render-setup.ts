// Built components require the built stylesheet's class names and layer order.
import '@luke-ui/react/stylesheet.css';
import { afterEach, beforeEach } from 'vite-plus/test';
import { installFixtureThemes } from './fixture-themes.js';
import { loadVisualFonts, pinCodeFontRendering } from './load-inter.js';
import { DESKTOP_SCREEN_WIDTH, mockScreenWidth } from './mock-screen-width.js';
import { cleanupMountedRenders } from './render-mount-state.js';
import { parkPointer } from './visual.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

installFixtureThemes();

let restoreCodeFontRendering: (() => void) | undefined;

beforeEach(async () => {
	mockScreenWidth(DESKTOP_SCREEN_WIDTH);
	// Load faces and pin code *rendering* before mount. Ownership stays here for the whole test —
	// `captureVisual` does not pin again. The pin does not remap `--luke-font-family-code`, so token
	// boards still show the production code stack.
	await loadVisualFonts();
	restoreCodeFontRendering = pinCodeFontRendering();
});

afterEach(async () => {
	// Release the pin even when React unmount throws, then park the pointer.
	try {
		cleanupMountedRenders();
	} finally {
		try {
			restoreCodeFontRendering?.();
		} finally {
			restoreCodeFontRendering = undefined;
			await parkPointer();
		}
	}
});
