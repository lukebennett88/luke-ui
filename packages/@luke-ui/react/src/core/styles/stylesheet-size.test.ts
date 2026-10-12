import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Measured at 13129 gzip bytes (level 9). The ceiling keeps about 200 bytes of headroom for the
// remaining component migrations. If this fails, investigate what grew; don't raise the ceiling
// without a reason.
const maximumGzipBytes = 13_330;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
