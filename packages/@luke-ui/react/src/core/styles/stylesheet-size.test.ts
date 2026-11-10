import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Gzip bytes at level 9. Set the ceiling about 200 bytes above the measured size when you raise it.
// If this fails, investigate what grew, and raise the ceiling only for growth you intend.
// The measured size is 17,146 bytes. It includes the registered state-layer @property, the adaptive
// tint declarations, the radio-group indicator states, the private fills, finishes, and pressed
// shadow each surface pairing sets for a low Button, and the private ring colour each pairing sets
// for the focus rings inside it, which adds 315 bytes. The built-in icon masks add 2,217 bytes: the
// stylesheet carries every icon's SVG source, since no separate icon asset ships. The measured size
// with them is 19,363 bytes.
const maximumGzipBytes = 19_549;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
