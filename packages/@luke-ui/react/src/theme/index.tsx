/**
 * Convenience class name combining the theme-root and CSS-reset classes. This is the low-level
 * path: apply it directly to `<html>` or another non-React root, or when composing a scope by
 * hand. Prefer `Theme` for React subtrees.
 */
export { themeRootClassName } from './theme-root-class-name.js';

/**
 * `Theme` applies a theme identity and/or colour mode to a React subtree. It is the recommended
 * entrypoint for theming a React app; `themeRootClassName` and `themeClassName` remain the
 * low-level path underneath it.
 */
export { Theme } from './theme.js';

/** Props for {@link Theme}. */
export type { ThemeProps } from './theme.js';

/**
 * `useThemeScope` reads the {@link ThemeScope} of the nearest enclosing `Theme`, or `null` outside
 * of one.
 */
export { useThemeScope } from './theme-scope.js';

/** The theme identity and colour mode a `Theme` applies to its subtree, and its colour mode type. */
export type { ColorMode, ThemeScope } from './theme-scope.js';

/**
 * `useThemeScopeProps` carries the enclosing theme scope onto a portal root React does not
 * otherwise place inside the themed subtree, such as a popover rendered into `document.body`.
 */
export { useThemeScopeProps } from './use-theme-scope-props.js';

/** Options and return props for {@link useThemeScopeProps}. */
export type { ThemeScopeProps, UseThemeScopePropsOptions } from './use-theme-scope-props.js';

/**
 * Typed access to the semantic theme custom properties. Each path resolves to a stable global
 * `--luke-*` variable reference, for example `vars.color.background.danger.solid.hover`.
 */
export { vars } from './contract.css.js';

/** The fixed spacing steps shared by the built-in themes. */
export { spaceScale } from './contract.js';
export type { SpaceStep } from './contract.js';

/** Typography size step keys in display order. */
export { fontSizeSteps } from './contract.js';

/** A typography size step key. */
export type { FontSizeStep } from './contract.js';

/**
 * `themeClassName(name)` returns the identity class for a theme name. `ThemeContrastError` is thrown
 * by `defineTheme` when a hard-gated pair misses WCAG 2.2 AA: 4.5:1 for text/on-solid pairs, 3:1 for
 * the focus ring and `border.control`. The six semantic `border.<role>` pairs are measured but
 * advisory only and cannot trigger this error. It carries every failing mode-and-pair in its `failures`
 * array. `ThemeGenerationError` is thrown when a role that must guarantee on-solid contrast (an
 * inaccessible explicit per-mode accent, for example) cannot reach an accessible solid. It names the
 * failing `role` and `mode`.
 */
export { ThemeContrastError, ThemeGenerationError, themeClassName } from './build-theme.js';

/** One WCAG contrast failure recorded on a {@link ThemeContrastError}. */
export type { ThemeContrastFailure } from './build-theme.js';

/**
 * `defineTheme(input)` is the curated authoring entry point: it normalises a small {@link ThemeInput}
 * (accent + neutral character, with everything else defaulting) into the per-mode foundation and
 * compiles it through `buildTheme`. It adapts single-value accents and neutrals per mode, generates
 * the radius scale, and merges optional materials over curated defaults. It throws the same
 * {@link ThemeContrastError} and {@link ThemeGenerationError} as `buildTheme`.
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
