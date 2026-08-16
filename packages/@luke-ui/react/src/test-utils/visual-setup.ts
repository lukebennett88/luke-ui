// Freeze CSS animations and transitions so animated UI (e.g. the loading
// spinner) screenshots deterministically. The Playwright provider also disables
// animations during capture; this is belt-and-suspenders and covers transitions
// triggered by interactions before the screenshot is taken.
//
// Also freeze the text-input caret, which blinks on its own timer and isn't a CSS animation.
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

// Overlay popovers close when a descendant is scrolled into view. Visual tests capture appearance,
// not scroll position, so skip that DOM scroll.
Element.prototype.scrollIntoView = () => {};
