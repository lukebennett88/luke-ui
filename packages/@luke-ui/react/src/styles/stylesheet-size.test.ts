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
// version — a URL-encoded SVG compresses worse than short CSS declarations.
// A third design pass (#247/#312 again) moved the invalid border back to 1px on TextInput and
// Combobox (their in-control icon already carries the non-colour cue) and moved Checkbox's icon
// off `content` onto the shared `Field` error message instead, gated behind a new
// `fieldMessageIcon` var. Net effect was a small decrease — dropping the `content` forced-colors
// selector and the border-width overrides outweighed the new message-icon rule.
// A follow-up fix in the same pass made TextInput's and Combobox's in-control icon follow the
// control's own `size` variant (a `createVar` per recipe) instead of a fixed constant, so it stays
// proportioned to the chevron/clear icons beside it at `small`. That added two more per-size `::after`
// rules (89,564 raw / 9,500 gzip).
// A second follow-up replaced the message icon's `flex` container with an ordinary block plus a
// `text-indent`/`padding-inline-start` hanging indent, because `flex` broke rich `errorMessage`
// content (a `ReactNode`) into independently-wrapping columns. The `calc()` padding/indent
// expressions cost a little more raw text than the `flex`/`gap` declarations they replaced; the
// limits below retain minimal reviewed headroom above the new measured total (89,793 raw / 9,565 gzip).
// A third follow-up (#247/#312 horizontal-alignment fix) dropped the separate
// `fieldMessageIconOffset` var and its `calc()` composition with `fieldMessageIndent`, and moved
// `invalidMessageIcon`'s own hang-indent-and-centring math onto `field.css.ts`'s single indent
// value instead. Net effect was a small decrease despite the new `max()` guard and
// `marginInlineEnd`; the limits retain minimal reviewed headroom above the new measured total
// (89,765 raw / 9,575 gzip).
// A fourth follow-up (#247/#312 Spectrum-match pass) swapped the `exclamationCircle` glyph for
// `exclamationTriangle` (a longer path, so a longer mask data URI in each of the three inlined
// copies) and reordered the in-control icon ahead of each control's trailing affordances with a
// plain `order` on `adornmentEnd` (`text-input.css.ts`) and the shared clear/trigger action styles
// (`combobox.css.ts`), plus a new `marginInlineEnd` on `invalidIndicatorIcon` matching its existing
// `marginInlineStart`. The limits retain minimal reviewed headroom above the new measured total
// (90,223 raw / 9,685 gzip).
const maximumRawBytes = 90_320;
const maximumGzipBytes = 9_735;

test('keeps the public stylesheet within its size budget', async () => {
	const stylesheet = await readFile(new URL('../../dist/stylesheet.css', import.meta.url));

	expect(stylesheet.byteLength, 'raw stylesheet size').toBeLessThanOrEqual(maximumRawBytes);
	expect(gzipSync(stylesheet, { level: 9 }).byteLength, 'gzip stylesheet size').toBeLessThanOrEqual(
		maximumGzipBytes,
	);
});
