import { lukeUiClassNames } from '../styles/class-names.js';
import { cx } from '../utils/index.js';

/**
 * Applies the descendant CSS reset and the base Luke UI typography and theme layer. It carries no
 * theme identity of its own. Apply it to `<body>`, `<main>`, an app shell, or any element you
 * already own.
 */
export const rootClassName = cx(lukeUiClassNames.themeRoot, lukeUiClassNames.resetRoot);

/**
 * Typed access to the semantic theme custom properties. Each path resolves to a stable global
 * `--luke-*` variable reference, for example `vars.color.background.danger.solid.hover`.
 */
export { vars } from './contract.css.js';

/** The fixed spacing steps shared by the built-in themes. */
export { spaceScale } from './contract.js';
export type { SpaceStep } from './contract.js';

/** Public semantic type style keys in ascending visual size. */
export { typeStyles } from './contract.js';

/** A public semantic type style key. */
export type { TypeStyle } from './contract.js';

/**
 * `ThemeContrastError` is thrown by `defineTheme` when a hard-gated pair misses WCAG 2.2 AA: 4.5:1
 * for text/on-solid pairs, 3:1 for the focus ring and `border.control`. The six semantic
 * `border.<role>` pairs are measured but advisory only and cannot trigger this error. It carries
 * every failing mode-and-pair in its `failures` array. For a theme built with `extends`, it also
 * carries `inheritance`, naming the chain of themes and which colours came from a base.
 * `ThemeGenerationError` is thrown when a role that must guarantee on-solid contrast (an
 * inaccessible explicit per-mode accent, for example) cannot reach an accessible solid. It names the
 * failing `role` and `mode`.
 */
export { ThemeContrastError, ThemeGenerationError } from './build-theme.js';

/** One WCAG contrast failure recorded on a {@link ThemeContrastError}. */
export type { ThemeContrastFailure } from './build-theme.js';

/** The colour provenance a `ThemeContrastError` carries for a theme built with `extends`. */
export type { ThemeInheritance } from './build-theme.js';

/**
 * `defineTheme(input)` is the curated authoring entry point: it normalises a small {@link ThemeInput}
 * (accent + neutral character, with everything else defaulting) into the per-mode foundation and
 * compiles it through `buildTheme`. It adapts single-value accents and neutrals per mode, generates
 * the radius scale, and merges optional materials over curated defaults. It also accepts an
 * {@link ExtendingThemeInput} and resolves its `extends` chain first. It throws the same
 * {@link ThemeContrastError} and {@link ThemeGenerationError} as `buildTheme`.
 */
export { defineTheme } from './define-theme.js';

/** The curated `defineTheme` authoring input plus its colour and material building blocks. */
export type {
	ColorInput,
	ControlFinish,
	DepthLadder,
	ExtendingThemeInput,
	ThemeInput,
} from './define-theme.js';

/** Curated defaults `defineTheme` applies for omitted materials and scrim. */
export { defaultControlFinish, defaultDepth, defaultScrim } from './define-theme.js';

/**
 * `getThemeClassName(name)` returns a theme's identity class, `luke-ui-theme-${name}`. Pass the same
 * `name` the theme's {@link ThemeInput} declares. Apply the result to the theme root when one
 * document loads more than one theme stylesheet, so the explicit identity outranks another theme's
 * `:root` fallback. It throws when the name is not the kebab-case `defineTheme` requires.
 */
export { getThemeClassName } from './theme-class-name.js';

/** Derives a concentric outer corner from an inner radius plus the intervening gap. */
export { deriveConcentricRadius } from './foundation.js';

/** Derives a concentric inner corner from an outer radius plus the intervening gap. */
export { deriveNestedRadius } from './foundation.js';
