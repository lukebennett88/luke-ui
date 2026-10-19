import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Measured at 13419 gzip bytes (level 9), including shared Prose element treatments. The ceiling
// keeps about 200 bytes of headroom. If this fails, investigate what grew; don't raise the ceiling
// without a reason.
const maximumGzipBytes = 13_620;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
