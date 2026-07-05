import { afterEach } from 'vite-plus/test';
import { cleanupVisual } from './render-visual.js';

// Freeze CSS animations and transitions so animated UI (e.g. the loading
// spinner) screenshots deterministically. The Playwright provider also disables
// animations during capture; this is belt-and-suspenders and covers transitions
// triggered by interactions before the screenshot is taken.
const freezeMotion = document.createElement('style');
freezeMotion.textContent = `
*, *::before, *::after {
	animation-delay: 0s !important;
	animation-duration: 0s !important;
	transition-delay: 0s !important;
	transition-duration: 0s !important;
}
`;
document.head.append(freezeMotion);

// Unmount everything rendered by `renderVisual` after each test, so individual
// visual test files never have to remember to clean up.
afterEach(() => {
	cleanupVisual();
});
