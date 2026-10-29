import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Gzip bytes at level 9. Set the ceiling about 200 bytes above the measured size when you raise it.
// If this fails, investigate what grew, and raise the ceiling only for growth you intend.
// The gap over the prior 15,081 baseline is the registered state-layer @property, the two adaptive
// tint declarations per mode, and the solid-chip pairing vars: 16,262 bytes measured. The focus
// ring context adds a `> *` rule per Box background and breakpoint: 16,535 bytes measured.
const maximumGzipBytes = 16_740;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
