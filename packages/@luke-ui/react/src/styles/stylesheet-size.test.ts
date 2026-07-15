import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Keep the public bundle below its pre-Sprinkles baseline while leaving room for normal growth.
const maximumRawBytes = 85_000;
const maximumGzipBytes = 8_800;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../dist/stylesheet.css', import.meta.url));

	expect(stylesheet.byteLength, 'raw stylesheet size').toBeLessThanOrEqual(maximumRawBytes);
	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
