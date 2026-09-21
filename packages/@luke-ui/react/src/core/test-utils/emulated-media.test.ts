import { expect, test } from 'vite-plus/test';
import {
	mergeEmulatedMediaFeature,
	peekEmulatedMediaFeatures,
	resetEmulatedMediaFeatures,
	toEmulatedMediaFeaturesPayload,
	updateEmulatedMediaFeature,
} from './emulated-media.js';

test('merge keeps sibling features when setting or clearing one', () => {
	const withForced = mergeEmulatedMediaFeature({}, 'forced-colors', 'active');
	expect(withForced).toEqual({ 'forced-colors': 'active' });

	const withBoth = mergeEmulatedMediaFeature(withForced, 'prefers-reduced-motion', 'reduce');
	expect(withBoth).toEqual({
		'forced-colors': 'active',
		'prefers-reduced-motion': 'reduce',
	});

	const restoredMotion = mergeEmulatedMediaFeature(withBoth, 'prefers-reduced-motion', undefined);
	expect(restoredMotion).toEqual({ 'forced-colors': 'active' });
});

test('payload lists every currently emulated feature', () => {
	expect(
		toEmulatedMediaFeaturesPayload({
			'forced-colors': 'active',
			'prefers-reduced-motion': 'reduce',
		}),
	).toEqual([
		{ name: 'forced-colors', value: 'active' },
		{ name: 'prefers-reduced-motion', value: 'reduce' },
	]);
});

test('freeze path preserves forced-colors while toggling reduced-motion', () => {
	resetEmulatedMediaFeatures();
	updateEmulatedMediaFeature('forced-colors', 'active');

	const previousReducedMotion = peekEmulatedMediaFeatures()['prefers-reduced-motion'];
	updateEmulatedMediaFeature('prefers-reduced-motion', 'reduce');
	expect(peekEmulatedMediaFeatures()).toEqual({
		'forced-colors': 'active',
		'prefers-reduced-motion': 'reduce',
	});

	updateEmulatedMediaFeature('prefers-reduced-motion', previousReducedMotion);
	expect(peekEmulatedMediaFeatures()).toEqual({ 'forced-colors': 'active' });
	expect(toEmulatedMediaFeaturesPayload(peekEmulatedMediaFeatures())).toEqual([
		{ name: 'forced-colors', value: 'active' },
	]);
});
