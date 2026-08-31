// Freeze CSS animations and transitions so animated UI (e.g. the loading
// spinner) screenshots deterministically. The Playwright provider also disables
// animations during capture; this is the belt-and-suspenders path for transitions
// triggered by interactions before the screenshot is taken.
//
// Also freeze the text-input caret, which blinks on its own timer and isn't a CSS animation.
//
// Overlays skip enter transitions under `prefers-reduced-motion: reduce`. Emulate that
// media feature so zeroed transition durations do not leave `[data-entering]` trays at
// opacity 0 for visual captures.
import { cdp } from 'vite-plus/test/context';

await cdp().send('Emulation.setEmulatedMedia', {
	features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});

const freezeMotion = document.createElement('style');
freezeMotion.textContent = `
*, *::before, *::after {
	animation-delay: 0s !important;
	animation-duration: 0s !important;
	transition-delay: 0s !important;
	transition-duration: 0s !important;
	caret-color: transparent !important;
}
[data-entering], [data-exiting] {
	opacity: 1 !important;
	translate: none !important;
}
`;
document.head.append(freezeMotion);
