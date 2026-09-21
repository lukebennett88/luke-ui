import { cdp } from 'vite-plus/test/context';
import type { EmulatedMediaFeatureName } from './emulated-media.js';
import {
	peekEmulatedMediaFeatures,
	toEmulatedMediaFeaturesPayload,
	updateEmulatedMediaFeature,
} from './emulated-media.js';

/**
 * The one CDP transport for emulated media. `Emulation.setEmulatedMedia` replaces the whole feature
 * list on every call, so a caller that sends a single feature silently clears the rest. Routing
 * every change through here keeps the merged set authoritative: a test that turns on forced colours
 * still has them when a capture toggles reduced motion.
 *
 * The merge itself lives in `emulated-media.ts`, which stays free of browser imports so the unit
 * project can test it.
 */
export async function setEmulatedMediaFeature(
	name: EmulatedMediaFeatureName,
	value: string | undefined,
): Promise<void> {
	updateEmulatedMediaFeature(name, value);
	await cdp().send('Emulation.setEmulatedMedia', {
		features: toEmulatedMediaFeaturesPayload(peekEmulatedMediaFeatures()),
	});
}

export async function emulateForcedColors(value: 'active' | 'none'): Promise<void> {
	await setEmulatedMediaFeature('forced-colors', value);
}

export async function emulateColorScheme(mode: 'light' | 'dark'): Promise<void> {
	await setEmulatedMediaFeature('prefers-color-scheme', mode);
}

export async function emulateReducedMotion(reduce: boolean): Promise<void> {
	await setEmulatedMediaFeature('prefers-reduced-motion', reduce ? 'reduce' : 'no-preference');
}
