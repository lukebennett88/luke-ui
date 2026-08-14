/**
 * Runs the build-time WCAG 2.2 validation matrix over a mode's emitted colour values and reports
 * every failing pair. It owns {@link ThemeContrastFailure} because it is what produces failures,
 * which also keeps `build-theme.ts` and its own validation step from importing each other.
 */

import type { Oklch } from './color.js';
import { compositeOver, contrastRatio, parseColor } from './color.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import type { ContrastCheck } from './diagnostics.js';
import type { SemanticColorValues } from './semantic-map.js';

/** Ghost Button and IconButton keep these foregrounds on a transparent rest fill. */
const GHOST_FOREGROUNDS = [
	'color.text.primary',
	'color.foreground.accent.rest',
	'color.foreground.danger.rest',
] as const;

const BUTTON_TONES = ['neutral', 'accent', 'danger'] as const;

/** The two surfaces a control can rest directly on. */
const BASE_SURFACES = ['color.surface.canvas', 'color.surface.recessed'] as const;

const SUBTLE_BUTTON_FOREGROUND = {
	accent: 'color.foreground.accent.hover',
	danger: 'color.foreground.danger.hover',
	neutral: 'color.text.primary',
} as const;

/** One first-party pair that paints content over a fill washed with `color.overlay.tint`. */
interface WashedPair {
	/** The fill the control rests on, which the tint is mixed into. */
	fill: string;
	/** The token path of the content painted on top. */
	foreground: string;
	/** How much tint the component's recipe mixes in. */
	percent: number;
}

/**
 * The washes first-party recipes actually paint, so the validated pairs track the component code.
 * Button hovers at 5% and presses at 10% on every appearance; Checkbox uses the stronger 15% and 20%
 * mixes a small control needs.
 */
const WASHED_PAIRS: ReadonlyArray<WashedPair> = [
	...[5, 10].flatMap((percent) => [
		// Ghost Button and IconButton: a transparent rest fill on canvas or recessed, so the wash lands
		// on the surface itself.
		...BASE_SURFACES.flatMap((fill) =>
			GHOST_FOREGROUNDS.map((foreground) => ({ fill, foreground, percent })),
		),
		// Solid and subtle Button and IconButton tones, over their own resting fill.
		...BUTTON_TONES.flatMap((tone) => [
			{
				fill: `color.background.${tone}.solid`,
				foreground: `color.foreground.${tone}.onSolid`,
				percent,
			},
			{
				fill: `color.background.${tone}.subtle`,
				foreground: SUBTLE_BUTTON_FOREGROUND[tone],
				percent,
			},
		]),
		// Combobox: a selected option rests on the accent subtle fill, an unselected one on the
		// floating popover.
		{ fill: 'color.background.accent.subtle', foreground: 'color.text.primary', percent },
		{ fill: 'color.surface.floating', foreground: 'color.text.primary', percent },
	]),
	// Checkbox: a selected or indeterminate box, and its invalid counterpart, wash their own solid
	// fill while keeping the matching on-solid glyph.
	...[15, 20].flatMap((percent) => [
		{
			fill: 'color.background.accent.solid',
			foreground: 'color.foreground.accent.onSolid',
			percent,
		},
		{
			fill: 'color.background.danger.solid',
			foreground: 'color.foreground.danger.onSolid',
			percent,
		},
	]),
];

type ColorMode = 'light' | 'dark';

/** One WCAG contrast failure recorded while generating a theme. */
export interface ThemeContrastFailure {
	/** Token path of the background colour, or an overlay composited over a surface. */
	background: string;
	/** Token path of the foreground colour, for example `color.text.primary`. */
	foreground: string;
	/** The colour mode the pair was generated for. */
	mode: 'light' | 'dark';
	/** The contrast ratio achieved by the best attempt. */
	ratio: number;
	/** The WCAG 2.2 AA ratio the pair must reach. */
	required: number;
}

interface ValidationResult {
	checks: Array<ContrastCheck>;
	failures: Array<ThemeContrastFailure>;
}

/**
 * Runs the full semantic validation matrix over the emitted (rounded) colour values: 88 hard checks
 * and 12 advisory checks per mode. Every pair is recorded as a {@link ContrastCheck}, and the hard
 * ones populate `failures` (which `compileTheme` raises as a
 * {@link import('./build-theme.js').ThemeContrastError}).
 *
 * Hard at the AA text ratio: functional primary and secondary text against all four elevation
 * surfaces; every role's resting and hover foreground against the base surfaces and that role's own
 * subtle fill; every role's on-solid foreground against its solid fill; and the real component
 * contracts that mix `overlay.tint` into a resting fill (ghost Button on canvas and recessed, solid
 * and subtle Button tones, selected Combobox options on accent subtle, unselected Combobox options
 * on floating, and the Checkbox's stronger mixes over accent and danger solid). Hard at the non-text
 * ratio: the authored focus ring and
 * `border.control`, which is `control-border.ts`'s solved boundary rather than a scale-step alias;
 * and `danger.solid` against the base surfaces, because it is the only role fill that carries a
 * required state's boundary (the invalid field boundary). This last gate is deliberately not
 * extended to the other five roles: a role's solid anchor is solved for 4.5:1 on-solid text, not for
 * 3:1 against the surface behind it, and for `warning` that lands at only 2.43:1 against canvas in
 * light mode.
 *
 * The six semantic borders alias step 7 of the 12-step scale, a subtle separator that deliberately
 * sits below the non-text ratio for a softer look, so they are advisory only — which is why a
 * component must never let one be the sole cue for a required state. `color.border.decorative`,
 * `color.text.disabled`, and `color.loadingSkeleton` keep their own separate policies and are not
 * measured here.
 */
export function validateContrast(
	mode: ColorMode,
	colorValues: SemanticColorValues,
): ValidationResult {
	const failures: Array<ThemeContrastFailure> = [];
	const checks: Array<ContrastCheck> = [];
	const colorAt = (path: string): Oklch => {
		const value = colorValues[path];
		if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
		return parseColor(value);
	};
	const checkResolved = (
		foreground: string,
		background: string,
		backgroundColor: Oklch,
		required: number,
		hard: boolean,
	) => {
		const ratio = contrastRatio(colorAt(foreground), backgroundColor);
		const passes = ratio >= required;
		// `hard` is recorded on the check itself, so tooling reads the compiler's own decision rather
		// than re-deriving it from token paths.
		checks.push({ background, foreground, hard, passes, ratio, required });
		if (hard && !passes) failures.push({ background, foreground, mode, ratio, required });
	};
	const check = (foreground: string, background: string, required: number, hard: boolean) => {
		checkResolved(foreground, background, colorAt(background), required, hard);
	};

	// v2 validates only against surfaces consumers can reference (the hidden `resting` rung is gone).
	const surfacePaths = ['canvas', 'recessed', 'floating', 'overlay'].map(
		(surface) => `color.surface.${surface}`,
	);
	const basePaths = BASE_SURFACES;

	// Functional text vs every mapped elevation surface: 8 checks.
	for (const text of ['color.text.primary', 'color.text.secondary']) {
		for (const surface of surfacePaths) check(text, surface, TEXT_RATIO, true);
	}
	// Per role: both foregrounds vs the base surfaces and that role's own subtle fill (36 checks), and
	// the on-solid foreground vs its solid fill (6). The scale generator already guarantees on-solid;
	// this revalidates it on the emitted, rounded values.
	for (const role of SEMANTIC_ROLES) {
		const subtle = `color.background.${role}.subtle`;
		for (const state of ['rest', 'hover']) {
			for (const background of [...basePaths, subtle]) {
				check(`color.foreground.${role}.${state}`, background, TEXT_RATIO, true);
			}
		}
		check(`color.foreground.${role}.onSolid`, `color.background.${role}.solid`, TEXT_RATIO, true);
	}
	// The keyboard-focus ring is authored and focus-visibility critical, so it stays a hard 3:1 gate,
	// and `border.control` is a solved boundary held to the same ratio: 4 checks.
	for (const background of basePaths) check('color.border.focus', background, UI_RATIO, true);
	for (const background of basePaths) check('color.border.control', background, UI_RATIO, true);
	// `danger.solid` vs the base surfaces: 2 checks. It is the only role fill that carries a
	// required state's boundary (the invalid field boundary), so it is held to the same hard
	// non-text ratio as the focus ring and `border.control`. This is deliberately NOT a per-role
	// loop: a role's solid anchor is solved for 4.5:1 on-solid text, not for 3:1 against the surface
	// behind it, and for `warning` that lands at only 2.43:1 against canvas in light mode. Extending
	// this gate to the other five roles throws `ThemeContrastError` on the bundled themes.
	for (const background of basePaths)
		check('color.background.danger.solid', background, UI_RATIO, true);
	// The six semantic borders, measured and reported but not gated: 12 advisory checks.
	for (const role of SEMANTIC_ROLES) {
		for (const background of basePaths) {
			check(`color.border.${role}`, background, UI_RATIO, false);
		}
	}
	// Interaction washes mix the opaque tint into the resting fill the control already has. Browsers
	// composite in gamma-encoded sRGB, which is what `compositeOver` does. Pairs come from the
	// `WASHED_PAIRS` table, which follows first-party recipes rather than every theoretical
	// combination: 32 checks.
	const tint = colorAt('color.overlay.tint');
	for (const { foreground, fill, percent } of WASHED_PAIRS) {
		const washed = compositeOver(tint, colorAt(fill), percent / 100);
		const background = `color.overlay.tint ${percent}% over ${fill}`;
		checkResolved(foreground, background, washed, TEXT_RATIO, true);
	}

	return { checks, failures };
}
