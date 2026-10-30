import { getThemeClassName } from '@luke-ui/react/theme';
import type { ThemeInput } from '@luke-ui/react/theme/compiler';
import { defineTheme } from '@luke-ui/react/theme/compiler';
import { chromaticTheme } from '../../theme/__fixtures__/chromatic.js';
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

/** A faint highlight, shade and sheen that overlap near the middle of a control. */
const layeredFinish = {
	raised:
		'linear-gradient(to bottom, rgb(255 255 255 / 0.1), transparent 60%), ' +
		'radial-gradient(70% 60% at 50% 55%, rgb(0 0 0 / 0.06), transparent), ' +
		'linear-gradient(115deg, transparent 30%, rgb(255 255 255 / 0.05) 50%, transparent 70%)',
	recessed:
		'linear-gradient(to bottom, rgb(0 0 0 / 0.1), transparent 55%), ' +
		'radial-gradient(70% 60% at 50% 55%, rgb(255 255 255 / 0.04), transparent)',
	resting:
		'linear-gradient(to bottom, rgb(255 255 255 / 0.08), transparent 60%, rgb(0 0 0 / 0.06)), ' +
		'linear-gradient(115deg, transparent 30%, rgb(255 255 255 / 0.05) 50%, transparent 70%)',
};

const layeredFinishTheme: ThemeInput = {
	...paperTheme,
	controlFinish: { dark: layeredFinish, light: layeredFinish },
	name: 'layered-finish-fixture',
};

/**
 * A finish whose two ends are transparent and whose middle band is a heavy mid-tone. Every declared
 * endpoint passes, and only the intermediate pixels pull text below 4.5:1. The band is dark in
 * light mode, where the text is dark, and light in dark mode, where the text is light. It exists
 * to prove the material contrast gate catches that, so no passing suite renders it.
 */
function midBandFinish(band: string) {
	const finish = `linear-gradient(to bottom, transparent 20%, ${band} 50%, transparent 80%)`;
	return { raised: finish, recessed: finish, resting: finish };
}

const midBandFailureTheme: ThemeInput = {
	...paperTheme,
	controlFinish: {
		dark: midBandFinish('rgb(150 150 150 / 0.7)'),
		light: midBandFinish('rgb(70 70 70 / 0.7)'),
	},
	name: 'mid-band-failure-fixture',
};

/**
 * A flat white wash over every dark finish rung, with Paper's colours otherwise. It lightens each
 * solid fill under its `onSolid` text and nothing else, so a failure here comes from the finish
 * alone. It exists to prove the material contrast gate catches that, so no passing suite renders it.
 */
const washFinish = 'linear-gradient(rgb(255 255 255 / 0.25), rgb(255 255 255 / 0.25))';

const washFailureTheme: ThemeInput = {
	...paperTheme,
	controlFinish: { dark: { raised: washFinish, recessed: washFinish, resting: washFinish } },
	name: 'wash-failure-fixture',
};

const fixtureThemes = {
	chromatic: chromaticTheme,
	contrastEdge: contrastEdgeTheme,
	layeredFinish: layeredFinishTheme,
	midBandFailure: midBandFailureTheme,
	washFailure: washFailureTheme,
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
