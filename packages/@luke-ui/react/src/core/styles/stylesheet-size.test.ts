import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Measured at 13669 gzip bytes (level 9), including native autofill, read-only, disabled, and
// forced-colour treatments. If this fails, investigate what grew; don't raise the ceiling without
// a reason.
const maximumGzipBytes = 13_700;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
