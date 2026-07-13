import { lukeUiClassNames } from '../styles/class-names.js';
import { themeClass } from '../theme.css.js';
import { cx } from '../utils/index.js';

/** The vanilla-extract CSS class that applies the design-token theme to its subtree. */
export { themeClass } from '../theme.css.js';

/** Convenience class name combining the theme, theme-root, and CSS-reset root classes. Apply to your app's root element. */
export const themeRootClassName = cx(
	themeClass,
	lukeUiClassNames.themeRoot,
	lukeUiClassNames.resetRoot,
);

/**
 * Typed access to the semantic theme custom properties. Each path resolves to a stable global
 * `--luke-*` variable reference, for example `vars.color.intent.danger.surface.solidHover`.
 */
export { vars } from './contract.css.js';

/**
 * `buildTheme(foundation)` compiles a typed theme foundation into complete stylesheet text: pure
 * and Node-compatible, containing the theme identity class plus both colour-mode blocks. It throws
 * {@link ThemeContrastError} naming the mode and token pair when a generated pair misses WCAG 2.2
 * AA (4.5:1 for text, 3:1 for non-text UI). Colours are computed and emitted in OKLCH.
 *
 * `themeClassName(name)` returns the identity class for a theme name. `ThemeContrastError` carries
 * every failing mode-and-pair in its `failures` array.
 */
export { buildTheme, ThemeContrastError, themeClassName } from './build-theme.js';

/** One WCAG contrast failure recorded on a {@link ThemeContrastError}. */
export type { ThemeContrastFailure } from './build-theme.js';

/** The typed theme-foundation contract accepted by `buildTheme`. */
export type {
	ActionControlFinishFoundation,
	ThemeDepthFoundation,
	ThemeFoundation,
	ThemeModeFoundation,
	ThemeSourceColors,
} from './foundation.js';

/** Derives a concentric outer corner from an inner radius plus the intervening gap. */
export { deriveConcentricRadius } from './foundation.js';
