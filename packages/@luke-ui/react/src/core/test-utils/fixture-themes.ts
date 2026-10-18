import { getThemeClassName } from '@luke-ui/react/theme';
import { defineTheme } from '@luke-ui/react/theme/compiler';
import { paperTheme } from '../../theme/__fixtures__/paper.js';
import { tactileTheme } from '../../theme/__fixtures__/tactile.js';
import { flatTheme } from './flat-theme.js';

/** The themes the visual suite renders, keyed by the name screenshot IDs use. */
const fixtureThemes = { flat: flatTheme, paper: paperTheme, tactile: tactileTheme } as const;

/** A fixture theme's name. */
export type FixtureThemeName = keyof typeof fixtureThemes;

/** Returns the identity class to set on `<html>` for a fixture theme. */
export function fixtureThemeClassName(theme: FixtureThemeName): string {
	return getThemeClassName(fixtureThemes[theme].name);
}

const FIXTURE_THEMES_STYLE_ID = 'luke-ui-fixture-themes';

/**
 * Compiles every fixture theme and adds the stylesheets to the document once. The fixtures name
 * Inter; browser setup loads the pinned Inter and JetBrains Mono faces and pins code *rendering*
 * before each test so mounts and captures share those metrics without remapping
 * `--luke-font-family-code`. Metric-sensitive tests can also call `loadInter()` / `loadVisualFonts()`.
 */
export function installFixtureThemes(): void {
	if (document.getElementById(FIXTURE_THEMES_STYLE_ID) !== null) return;
	const style = document.createElement('style');
	style.id = FIXTURE_THEMES_STYLE_ID;
	style.textContent = Object.values(fixtureThemes).map(defineTheme).join('\n');
	document.head.append(style);
}
