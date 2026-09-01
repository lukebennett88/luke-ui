import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Measured from the pull request merge commit 7518d094 at 10259 gzip bytes (level 9), per the
// measurement procedure in issue #550. Raised after Field and InputGroup StyleX migration (those
// recipes emit mutually exclusive state selectors that gzip larger than the Vanilla Extract
// versions). Ceiling leaves headroom for StyleX mutually exclusive state selectors. If this fails,
// investigate what grew; don't raise the ceiling without a reason.
const maximumGzipBytes = 13_500;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../../dist/stylesheet.css', import.meta.url));

	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
