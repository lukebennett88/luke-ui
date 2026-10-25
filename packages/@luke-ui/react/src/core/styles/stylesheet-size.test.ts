import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Gzip bytes at level 9. Set the ceiling about 200 bytes above the measured size when you raise it.
// If this fails, investigate what grew, and raise the ceiling only for growth you intend.
// Raised for #925: registered state-layer @property, adaptive Button rules, and solid-chip pairing
// vars (~1.0 kB gzip above the prior 15,081 baseline).
const maximumGzipBytes = 16_320;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
