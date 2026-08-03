import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Fixed budget for the public stylesheet's gzip size, with deliberate headroom above
// current usage — not a record of where the stylesheet happens to sit today. It exists
// to catch a structural regression, like a new responsive utility matrix, not to be kept
// in sync with normal growth. If it fails, investigate what grew; don't raise the ceiling.
const maximumGzipBytes = 12_000;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
