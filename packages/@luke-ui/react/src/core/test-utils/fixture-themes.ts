import { getThemeClassName } from '@luke-ui/react/theme';
import type { ThemeInput } from '@luke-ui/react/theme/compiler';
import { defineTheme } from '@luke-ui/react/theme/compiler';
import { paperTheme } from '../../theme/__fixtures__/paper.js';
import { tactileTheme } from '../../theme/__fixtures__/tactile.js';
import { flatTheme } from './flat-theme.js';

/** The themes the visual suite renders, keyed by the name screenshot IDs use. */
const contrastEdgeTheme: ThemeInput = {
	...paperTheme,
	color: {
		...paperTheme.color,
		accent: { light: '#fde68a' },
		surface: { raised: { dark: 'oklch(0.30 0.01 250)' } },
	},
	name: 'contrast-edge-fixture',
};

const fixtureThemes = {
	contrastEdge: contrastEdgeTheme,
	flat: flatTheme,
	paper: paperTheme,
	tactile: tactileTheme,
} as const;

/** A fixture theme's name. */
export type FixtureThemeName = keyof typeof fixtureThemes;

/** Returns the identity class to set on `<html>` for a fixture theme. */
export function fixtureThemeClassName(theme: FixtureThemeName): string {
	return getThemeClassName(fixtureThemes[theme].name);
}

const FIXTURE_THEMES_STYLE_ID = 'luke-ui-fixture-themes';

/**
 * Compiles every fixture theme and adds the stylesheets to the document once. The fixtures name
 * Inter; browser setup loads that face before each test so mounts and captures share its metrics.
 * Metric-sensitive tests can also call `loadInter()`.
 */
export function installFixtureThemes(): void {
	if (document.getElementById(FIXTURE_THEMES_STYLE_ID) !== null) return;
	const style = document.createElement('style');
	style.id = FIXTURE_THEMES_STYLE_ID;
	style.textContent = Object.values(fixtureThemes).map(defineTheme).join('\n');
	document.head.append(style);
}
