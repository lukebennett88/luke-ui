/**
 * The bare custom-property name `--text-line-height` wrapped as a full `var(--…)` reference.
 * `text/recipe.ts` sets this same custom property to Text's resolved line height so an element
 * sized against the surrounding text's line box (for example Checkbox's control, which falls back
 * to `1lh` outside a `Text` ancestor) can read it.
 *
 * Kept in its own plain module: StyleX's Babel plugin only resolves a computed `stylex.create` key
 * through an imported identifier when that identifier comes from a `.stylex.ts` theming module, so
 * `text/recipe.ts` and Checkbox's `recipe.ts` repeat the bare property name as a literal rather
 * than importing it from here. Checkbox reads `var(--text-line-height, 1lh)`.
 */
export const textLineHeight = 'var(--text-line-height)' as const;
