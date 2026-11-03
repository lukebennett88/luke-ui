import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Gzip bytes at level 9. Set the ceiling about 200 bytes above the measured size when you raise it.
// If this fails, investigate what grew, and raise the ceiling only for growth you intend.
// The prior 16,262-byte measurement included the registered state-layer @property and the adaptive
// tint declarations. The radio-group indicator adds interaction and forced-colour states: 16,778
// bytes measured. Each surface pairing now carries the private fills, finishes, and pressed shadow a
// low Button reads, in place of the solid-chip values: 16,902 bytes measured.
const maximumGzipBytes = 17_102;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
