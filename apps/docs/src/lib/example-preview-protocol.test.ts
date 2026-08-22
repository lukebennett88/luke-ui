import { expect, test } from 'vite-plus/test';
import { isExamplePreviewHeightMessage } from './example-preview-protocol.js';

test('accepts a finite example preview height message', () => {
	expect(isExamplePreviewHeightMessage({ height: 240, type: 'example-preview:height' })).toBe(true);
});

test('rejects malformed example preview height messages', () => {
	expect(isExamplePreviewHeightMessage({ height: Infinity, type: 'example-preview:height' })).toBe(
		false,
	);
	expect(isExamplePreviewHeightMessage({ height: '240', type: 'example-preview:height' })).toBe(
		false,
	);
	expect(isExamplePreviewHeightMessage({ height: 240, type: 'other' })).toBe(false);
	expect(
		isExamplePreviewHeightMessage({
			height: Number.MAX_SAFE_INTEGER + 1,
			type: 'example-preview:height',
		}),
	).toBe(false);
});
