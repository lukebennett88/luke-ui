import * as stylex from '@stylexjs/stylex';

/**
 * The `exclamationTriangle` mask URL shared by every invalid indicator: `Field`'s error-message
 * `::before` and `Combobox`'s in-control `::after`.
 *
 * The canonical source of this data URI is the generated `.generated/icon-mask-data.ts`
 * (`iconMaskUrls.exclamationTriangle`, written by `scripts/build-icons.ts`). StyleX cannot read it:
 * the compiler needs a statically known value at build time, and a `Record<IconName, string>`
 * imported from a plain generated `.ts` module is neither resolvable by the plugin (it has no
 * `@stylexjs/stylex` import, so the plugin skips it) nor statically indexable. The value is
 * therefore mirrored here as a `defineConsts` literal. `input-states.test.ts` asserts it
 * still matches `iconMaskUrls.exclamationTriangle`, so a regenerated icon set cannot drift from
 * this copy without failing a test.
 */
export const invalidIndicator = stylex.defineConsts({
	maskImage:
		'url("data:image/svg+xml,%3Csvg%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.5%22%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%3E%0A%20%20%3Cpath%20d%3D%22M12%209v3.75m-9.303%203.376c-.866%201.5.217%203.374%201.948%203.374h14.71c1.73%200%202.813-1.874%201.948-3.374L13.949%203.378c-.866-1.5-3.032-1.5-3.898%200L2.697%2016.126ZM12%2015.75h.007v.008H12v-.008Z%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20%2F%3E%0A%3C%2Fsvg%3E%0A")',
	// Keeps the icon solid and high-contrast when author colours are ignored. Merged into each
	// consuming recipe's own `(forced-colors: active)` block.
	forcedColorsBackgroundColor: 'CanvasText',
});
