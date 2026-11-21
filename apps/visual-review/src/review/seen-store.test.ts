import { describe, expect, test } from 'vite-plus/test';
import type { Capture } from '../report/schema.js';
import { captureFingerprint, seenState } from './seen-store.js';

const capture: Capture = {
	component: 'button',
	height: 300,
	id: 'button/primary',
	mismatchedPixels: 260,
	name: 'primary',
	status: 'changed',
	width: 200,
};

describe('captureFingerprint', () => {
	test('uses the published fingerprint', () => {
		const fingerprint = 'a'.repeat(64);

		expect(captureFingerprint({ ...capture, fingerprint })).toBe(fingerprint);
	});

	test('falls back to the size and differing pixels for a report without one', () => {
		expect(captureFingerprint(capture)).toBe('button/primary:200x300:260');
		expect(captureFingerprint({ ...capture, mismatchedPixels: 261 })).not.toBe(
			captureFingerprint(capture),
		);
	});
});

describe('seenState', () => {
	test('is unseen until the reviewer marks the capture viewed', () => {
		expect(seenState({}, capture)).toBe('unseen');
	});

	test('is seen while the capture keeps the fingerprint the reviewer viewed', () => {
		expect(seenState({ [capture.id]: captureFingerprint(capture) }, capture)).toBe('seen');
	});

	test('is changed once a later commit changes the capture’s images', () => {
		const record = { [capture.id]: 'a'.repeat(64) };

		expect(seenState(record, { ...capture, fingerprint: 'b'.repeat(64) })).toBe('changed');
	});
});
