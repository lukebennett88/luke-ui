import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

// Keep the public bundle below its pre-Sprinkles baseline while leaving room for reviewed components.
// Checkbox size variants measured 500 raw bytes and 10 gzip bytes; the limits retain minimal
// reviewed headroom.
// #247's shared invalid-indicator (a gated 2px boundary plus a non-colour `::after` cue, applied to
// TextInput, Combobox, and Checkbox, each with its own forced-colors override) measured roughly 3150
// raw bytes and 230 gzip bytes across the three recipes; the limits retained minimal reviewed
// headroom above that.
// The indicator's later polish pass (design review on #247/#312) replaced a text-glyph badge with
// the `exclamationCircle` icon rendered as a `mask-image` data URI, one inlined per recipe that
// applies it (three total). That added roughly 730 raw bytes and 590 gzip bytes over the badge
// version — a URL-encoded SVG compresses worse than short CSS declarations — so the limits below
// retain minimal reviewed headroom above the new measured total (89,481 raw / 9,793 gzip).
const maximumRawBytes = 89_600;
const maximumGzipBytes = 9_850;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../dist/stylesheet.css', import.meta.url));

	expect(stylesheet.byteLength, 'raw stylesheet size').toBeLessThanOrEqual(maximumRawBytes);
	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
