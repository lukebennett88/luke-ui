/**
 * The bare custom-property name `--text-line-height` wrapped as a full `var(--…)` reference, for a
 * Vanilla Extract consumer to pass straight to `fallbackVar`, which requires that shape (see
 * `checkbox/recipe.css.ts`). `text/recipe.ts` sets this same custom property to Text's resolved
 * line height so an element sized against the surrounding text's line box (for example
 * `Checkbox`'s control, which falls back to `1lh` outside a `Text` ancestor) can read it.
 *
 * Kept in its own plain module, with no Vanilla Extract or StyleX import: `checkbox/recipe.css.ts`
 * is still Vanilla Extract, and Vanilla Extract's build-time module evaluation cannot tolerate an
 * uncompiled `stylex.*` call reached transitively through an import, which `text/recipe.ts` (a
 * StyleX module) would otherwise pull in. `text/recipe.ts` repeats the bare property name
 * `'--text-line-height'` as a literal rather than importing it from here, because StyleX's Babel
 * plugin only resolves a computed `stylex.create` key through an imported identifier when that
 * identifier comes from a `.stylex.ts` theming module.
 */
export const textLineHeight = 'var(--text-line-height)' as const;
