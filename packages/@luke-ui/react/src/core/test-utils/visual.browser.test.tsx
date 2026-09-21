import { expect, test } from 'vite-plus/test';
import { emulateColorScheme, emulateForcedColors, emulateReducedMotion } from './emulate-media.js';
import { freezeMotionForCapture } from './visual.js';

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
