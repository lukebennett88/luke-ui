import { lukeUiClassNames } from '../styles/class-names.js';
import { cx } from '../utils/index.js';

/** Convenience class name combining the theme-root and CSS-reset classes. */
export const themeRootClassName = cx(lukeUiClassNames.themeRoot, lukeUiClassNames.resetRoot);

/**
 * Typed access to the semantic theme custom properties. Each path resolves to a stable global
 * `--luke-*` variable reference, for example `vars.color.intent.danger.surface.solidHover`.
 */
export { vars } from './contract.css.js';

/**
 * `themeClassName(name)` returns the identity class for a theme name. `ThemeContrastError` is thrown
 * by `defineTheme` when a resolved pair misses WCAG 2.2 AA (4.5:1 for text, 3:1 for non-text UI); it
 * carries every failing mode-and-pair in its `failures` array.
 */
export { ThemeContrastError, themeClassName } from './build-theme.js';

/** One WCAG contrast failure recorded on a {@link ThemeContrastError}. */
export type { ThemeContrastFailure } from './build-theme.js';

/**
 * `defineTheme(input)` is the curated authoring entry point: it normalises a small {@link ThemeInput}
 * (accent + neutral character, with everything else defaulting) into the per-mode foundation and
 * compiles it through `buildTheme`. It adapts single-value accents and neutrals per mode, generates
 * the radius scale, and merges optional materials over curated defaults. It throws when a
 * single-value accent has no accessible lightness, and otherwise throws the same
 * {@link ThemeContrastError} as `buildTheme`.
 */
export { defineTheme } from './define-theme.js';

/** The curated `defineTheme` authoring input plus its colour and material building blocks. */
export type { ColorInput, ControlFinish, DepthLadder, ThemeInput } from './define-theme.js';

/** Curated defaults `defineTheme` applies for omitted materials and scrim. */
export { defaultControlFinish, defaultDepth, defaultScrim } from './define-theme.js';

/** Derives a concentric outer corner from an inner radius plus the intervening gap. */
export { deriveConcentricRadius } from './foundation.js';

/** Derives a concentric inner corner from an outer radius plus the intervening gap. */
export { deriveNestedRadius } from './foundation.js';
