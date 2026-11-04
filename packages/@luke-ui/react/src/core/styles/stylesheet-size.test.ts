import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Gzip bytes at level 9. Set the ceiling about 200 bytes above the measured size when you raise it.
// If this fails, investigate what grew, and raise the ceiling only for growth you intend.
// The measured size is 16,902 bytes. It includes the registered state-layer @property, the adaptive
// tint declarations, the radio-group indicator states, and the private fills, finishes, and pressed
// shadow each surface pairing sets for a low Button. Those replace the solid-chip values, for a net
// 124 bytes more.
const maximumGzipBytes = 17_102;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
