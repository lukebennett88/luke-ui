import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { expect, test } from 'vite-plus/test';
import { THEME_IDENTITY_CLASS_NAMES } from './theme-prefs-shared.js';

test('matches each theme package themeClassName', () => {
	expect(THEME_IDENTITY_CLASS_NAMES).toEqual({
		paper: paperThemeClassName,
		tactile: tactileThemeClassName,
	});
});
