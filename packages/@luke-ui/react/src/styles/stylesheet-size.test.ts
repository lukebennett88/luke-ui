import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Budget for the public stylesheet, with a little headroom above the last measured size.
// If this test fails: re-measure `dist/stylesheet.css` (raw and gzip) and deliberately
// update both constants below to the new size plus a small reviewed margin — don't just
// nudge the numbers until it passes.
const maximumRawBytes = 88_420;
const maximumGzipBytes = 9_520;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../dist/stylesheet.css', import.meta.url));

	expect(stylesheet.byteLength, 'raw stylesheet size').toBeLessThanOrEqual(maximumRawBytes);
	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
