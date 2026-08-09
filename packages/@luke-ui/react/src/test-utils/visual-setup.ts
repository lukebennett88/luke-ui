// Freeze CSS animations and transitions so animated UI (e.g. the loading
// spinner) screenshots deterministically. The Playwright provider also disables
// animations during capture; this is belt-and-suspenders and covers transitions
// triggered by interactions before the screenshot is taken.
//
// Also disable the text-input caret. A blinking caret is driven by the user
// agent, not a CSS animation, so the freeze above doesn't cover it: whether a
// focused text-field capture lands mid-blink is down to timing, not the tree
// under test, and produced a false mismatch in #249's noise-floor measurement.
const freezeMotion = document.createElement('style');
freezeMotion.textContent = `
*, *::before, *::after {
	animation-delay: 0s !important;
	animation-duration: 0s !important;
	transition-delay: 0s !important;
	transition-duration: 0s !important;
	caret-color: transparent !important;
}
`;
document.head.append(freezeMotion);
