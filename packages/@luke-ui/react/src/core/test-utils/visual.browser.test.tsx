import { expect, test } from 'vite-plus/test';
import { emulateColorScheme, emulateForcedColors, emulateReducedMotion } from './emulate-media.js';
import { freezeMotionForCapture } from './visual.js';

// Cancelling a mid-flight `text-decoration-color` transition with `transition: none` used to leave
// the underline invisible at capture time (link/kitchen-sink-tactile-light flake). Finish first.
test('freezing motion finishes an in-flight text-decoration-color transition', async () => {
	const link = document.body.appendChild(document.createElement('a'));
	link.textContent = 'Destination';
	link.href = '#';
	link.style.color = 'rgb(0, 0, 0)';
	link.style.textDecorationLine = 'underline';
	link.style.textDecorationColor = 'transparent';
	link.style.transitionProperty = 'text-decoration-color';
	link.style.transitionDuration = '10s';
	link.style.transitionTimingFunction = 'linear';
	// Force the starting style, then start a long transition toward the resting colour.
	void link.offsetHeight;
	link.style.textDecorationColor = 'rgb(0, 0, 0)';
	void link.offsetHeight;
	expect(link.getAnimations().length).toBeGreaterThan(0);

	const restore = await freezeMotionForCapture();
	try {
		const color = getComputedStyle(link).textDecorationColor;
		expect(color).toBe('rgb(0, 0, 0)');
		expect(link.getAnimations().length).toBe(0);
	} finally {
		await restore();
		link.remove();
	}
});

// `Emulation.setEmulatedMedia` replaces the whole feature list, so a helper that sends one feature
// on its own drops the others. Every emulation helper shares one merged feature set to prevent it.
test('forced-colors stays active while a capture freezes reduced-motion', async () => {
	await emulateForcedColors('active');
	expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

	const restore = await freezeMotionForCapture();
	try {
		expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
		expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
	} finally {
		await restore();
	}

	expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
	expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);

	await emulateForcedColors('none');
});

test('the colour-scheme and reduced-motion helpers each keep forced-colors', async () => {
	await emulateForcedColors('active');

	await emulateColorScheme('dark');
	expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
	expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

	await emulateReducedMotion(true);
	expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
	expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
	expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

	await emulateReducedMotion(false);
	await emulateColorScheme('light');
	await emulateForcedColors('none');
});

// A capture restores whatever reduced-motion value was in force before it, not a hardcoded default.
test('a capture restores an explicitly set reduced-motion preference', async () => {
	await emulateReducedMotion(true);

	const restore = await freezeMotionForCapture();
	await restore();

	expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);

	await emulateReducedMotion(false);
});
