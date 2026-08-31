import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Measured at commit a974f88 on the corrected #550 output at 10390 gzip bytes (level 9). Ceiling leaves
// headroom for the remaining component migrations. If this fails, investigate what grew; don't raise the
// ceiling without a reason.
const maximumGzipBytes = 12_500;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
