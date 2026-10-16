import { expect, test } from 'vite-plus/test';
import { monacoChromeColors, SHIKI_THEME_REGISTRATIONS } from './shiki-theme.js';

const [lightTheme, darkTheme] = SHIKI_THEME_REGISTRATIONS;

test('monaco chrome colours come from the registered GitHub high-contrast themes', () => {
	expect(monacoChromeColors.light.background).toBe(lightTheme.colors?.['editor.background']);
	expect(monacoChromeColors.light.lineNumber).toBe(
		lightTheme.colors?.['editorLineNumber.foreground'],
	);
	expect(monacoChromeColors.dark.background).toBe(darkTheme.colors?.['editor.background']);
	expect(monacoChromeColors.dark.lineNumber).toBe(
		darkTheme.colors?.['editorLineNumber.foreground'],
	);
});
