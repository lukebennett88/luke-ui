import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { expect, test } from 'vite-plus/test';
import { toHighContrastMonacoTheme } from './monaco-theme.js';
import { SHIKI_THEME_REGISTRATIONS } from './shiki-theme.js';

const highlighter = await createHighlighterCore({
	engine: createJavaScriptRegexEngine(),
	langs: [],
	themes: SHIKI_THEME_REGISTRATIONS,
});

const [light, dark] = SHIKI_THEME_REGISTRATIONS;
const registrations = { dark, light };

// Monaco only applies `editor.selectionForeground` on high-contrast bases.
// On `vs` / `vs-dark` the opaque GitHub selection hides the selected text.
const selections = {
	dark: { background: '#ffffff', base: 'hc-black', foreground: '#0a0c10' },
	light: { background: '#0e1116', base: 'hc-light', foreground: '#ffffff' },
} as const;

for (const mode of ['light', 'dark'] as const) {
	test(`${mode} theme keeps readable selected text`, () => {
		const theme = toHighContrastMonacoTheme(highlighter.getTheme(registrations[mode]));
		const { background, base, foreground } = selections[mode];

		expect(theme.base).toBe(base);
		expect(theme.colors['editor.selectionBackground']).toBe(background);
		expect(theme.colors['editor.selectionForeground']).toBe(foreground);
	});
}
