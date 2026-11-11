import { textmateThemeToMonacoTheme } from '@shikijs/monaco';
import type { editor } from 'monaco-editor';
import type { ThemeRegistrationResolved } from 'shiki/core';

/**
 * Converts a Shiki theme to a Monaco theme on a high-contrast base.
 *
 * Monaco only applies `editor.selectionForeground` on the `hc-light` and
 * `hc-black` bases. Both GitHub high-contrast themes use an opaque selection
 * background, so on `vs` or `vs-dark` the selected text becomes unreadable.
 * See https://github.com/shikijs/shiki/issues/1081.
 */
export function toHighContrastMonacoTheme(
	theme: ThemeRegistrationResolved,
): editor.IStandaloneThemeData {
	// `@shikijs/monaco` types extend `monaco-editor-core`, which isn't installed,
	// so its `MonacoTheme` has no known fields.
	const monacoTheme = textmateThemeToMonacoTheme(theme) as editor.IStandaloneThemeData;
	return { ...monacoTheme, base: theme.type === 'light' ? 'hc-light' : 'hc-black' };
}
