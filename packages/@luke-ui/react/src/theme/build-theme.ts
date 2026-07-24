import appleSystemMetrics from '@capsizecss/metrics/appleSystem';
import dMSansMetrics from '@capsizecss/metrics/dMSans';
import interMetrics from '@capsizecss/metrics/inter';
import { precomputeValues } from '@capsizecss/vanilla-extract';
import type { Oklch } from './color.js';
import { clampUnit, contrastRatio, gamutMapOklch, parseColor } from './color.js';
import { flattenThemeContract, fontSizeSteps } from './contract.js';
import type {
	ContrastCheck,
	FamilyDiagnostics,
	ThemeDiagnostics,
	ThemeGenerationDiagnostics,
	ThemeModeDiagnostics,
} from './diagnostics.js';
import type { GeneratedSurfaces } from './elevation.js';
import { generateSurfaces } from './elevation.js';
import type { ThemeFoundation, ThemeModeFoundation, ThemeSourceColors } from './foundation.js';
import {
	defaultFontFamily,
	defaultFontWeights,
	defaultRadius,
	defaultSourceColors,
	themeFontFamilyStacks,
} from './foundation.js';
import type { FamilyRole, ScaleFamily } from './scale.js';
import { generateFamilyWithDiagnostics, ScaleGenerationError } from './scale.js';
import type { SemanticColorValues } from './semantic-map.js';
import { mapSemanticColors } from './semantic-map.js';

/**
 * Compiles a theme foundation into a complete static stylesheet plus its {@link ThemeDiagnostics}.
 *
 * Per mode: resolves the source colours and canvas anchor, generates the six private scale families
 * (neutral / accent / danger / info / success / warning), derives the mode-aware elevation surfaces,
 * applies the one default semantic mapping onto the colour contract, and runs the full WCAG 2.2
 * validation matrix — which stays authoritative for text and on-solid pairs.
 *
 * Pure and Node-compatible: no DOM and deterministic output. Throws {@link ThemeGenerationError}
 * when a role that must guarantee on-solid contrast cannot reach an accessible solid (an inaccessible
 * explicit per-mode accent, for example), and {@link ThemeContrastError} when a generated text or
 * on-solid pair misses AA. The returned `diagnostics` describe a fully compiled theme only; a build
 * that throws never returns them. Colours are computed and emitted in OKLCH.
 */
export function compileTheme(foundation: ThemeFoundation): {
	css: string;
	diagnostics: ThemeDiagnostics;
} {
	validateFoundation(foundation);
	const light = buildModeValues('light', foundation.light);
	const dark = buildModeValues('dark', foundation.dark);
	const failures = [...light.failures, ...dark.failures];
	if (failures.length > 0) throw new ThemeContrastError(failures);
	return {
		css: assembleStylesheet(foundation, light.values, dark.values),
		diagnostics: { dark: dark.diagnostics, light: light.diagnostics },
	};
}

/**
 * Compiles a theme foundation into a complete static stylesheet. Thin wrapper over
 * {@link compileTheme} that returns only the emitted CSS; callers that need the diagnostics data
 * model (tests, Storybook) use `compileTheme` directly. Throws the same errors as `compileTheme`.
 */
export function buildTheme(foundation: ThemeFoundation): string {
	return compileTheme(foundation).css;
}

/**
 * Returns the identity class for a theme name, `luke-ui-theme-${name}`. Throws when the name is
 * not kebab-case.
 */
export function themeClassName(name: string): string {
	if (!THEME_NAME_PATTERN.test(name)) {
		throw new Error(
			`Theme name "${name}" must be kebab-case: lowercase letters and digits separated by ` +
				'single hyphens, starting with a letter.',
		);
	}
	return `luke-ui-theme-${name}`;
}

/** One WCAG contrast failure recorded while generating a theme. */
export interface ThemeContrastFailure {
	/** The colour mode the pair was generated for. */
	mode: 'light' | 'dark';
	/** Token path of the foreground colour, for example `color.text.primary`. */
	foreground: string;
	/** Token path of the background colour, for example `color.surface.floating`. */
	background: string;
	/** The contrast ratio achieved by the best attempt. */
	ratio: number;
	/** The WCAG 2.2 AA ratio the pair must reach. */
	required: number;
}

/**
 * Thrown by `buildTheme` when generated colours miss WCAG 2.2 AA contrast. Aggregates every
 * failing mode-and-pair before throwing, one per message line.
 */
export class ThemeContrastError extends Error {
	/** Every failing pair across both modes. */
	readonly failures: Array<ThemeContrastFailure>;

	constructor(failures: Array<ThemeContrastFailure>) {
		super(
			[
				'Theme foundation fails WCAG 2.2 AA contrast:',
				...failures.map((failure) => {
					return (
						`${failure.mode}: ${failure.foreground} on ${failure.background} — ` +
						`${failure.ratio.toFixed(2)}:1 < ${failure.required}:1`
					);
				}),
			].join('\n'),
		);
		this.failures = failures;
		this.name = 'ThemeContrastError';
	}
}

/**
 * Thrown by {@link compileTheme} when a role that must guarantee on-solid contrast cannot reach an
 * accessible solid — for example an explicit per-mode accent whose whole tone band is an on-solid
 * dead zone. Single-value accents are pre-conditioned into an accessible band by `defineTheme`, so
 * this surfaces for verbatim per-mode sources that the author asked to use exactly. Re-raises the
 * scale generator's {@link ScaleGenerationError} with the failing `role`/`mode`, the closest
 * `bestAttempt`, and the partial {@link ThemeGenerationDiagnostics} resolved before the failure.
 */
export class ThemeGenerationError extends Error {
	/** The role whose family could not be generated. */
	readonly role: FamilyRole;
	/** The mode the family was being generated for. */
	readonly mode: ColorMode;
	/** The closest the solid-anchor search came to satisfying the on-solid gate. */
	readonly bestAttempt: ScaleGenerationError['bestAttempt'];
	/** The partial diagnostics resolved before the failing role threw. */
	readonly diagnostics: ThemeGenerationDiagnostics;

	constructor(cause: ScaleGenerationError, diagnostics: ThemeGenerationDiagnostics) {
		super(cause.message);
		this.role = cause.role;
		this.mode = cause.mode;
		this.bestAttempt = cause.bestAttempt;
		this.diagnostics = diagnostics;
		this.name = 'ThemeGenerationError';
	}
}

type ColorMode = 'light' | 'dark';

const THEME_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const TEXT_RATIO = 4.5;
const UI_RATIO = 3;
// border.control is solved past the nominal 3:1 gate so 4-decimal OKLCH emission cannot round a
// passing pair below it, mirroring the on-solid search's headroom in scale.ts.
const CONTROL_BORDER_HEADROOM = 0.05;
const CONTROL_BORDER_SEARCH_STEP = 0.0025;

// The six private scale families, generated in this order so a build that fails part-way reports the
// families it had already resolved. Feedback roles never throw (they do not guarantee on-solid).
const FAMILY_ROLES = ['neutral', 'accent', 'danger', 'info', 'success', 'warning'] as const;
// Action intents render the full interactive ramp (subtle trio + solid trio + onSolid); feedback
// intents are static and expose only the soft kit (subtle surface + border + text).
const ACTION_INTENTS = ['neutral', 'accent', 'danger'] as const;
const FEEDBACK_INTENTS = ['info', 'success', 'warning'] as const;
// Accent and danger additionally expose a border and low-contrast text.
const BORDER_AND_TEXT_INTENTS = ['accent', 'danger'] as const;
// Parse-validated per-mode source colours. `background` is the resolved canvas anchor (#242); `focus`
// is the authored keyboard-focus ring; both are colours the foundation must carry.
const SOURCE_COLOR_FIELDS = [
	'neutral',
	'background',
	'accent',
	'info',
	'success',
	'warning',
	'danger',
	'focus',
] as const;

const SPACE_VALUES = {
	100: '4px',
	200: '8px',
	300: '12px',
	400: '16px',
	600: '24px',
	800: '32px',
	1000: '40px',
	1200: '48px',
	1600: '64px',
} as const;

const MOTION_VALUES = {
	'motion.duration.fast': '120ms',
	'motion.easing.exit': 'cubic-bezier(0.3, 0, 1, 1)',
	'motion.easing.standard': 'cubic-bezier(0, 0, 0.4, 1)',
} as const;

const FONT_VALUES = {
	'font.100.fontSize': '12px',
	'font.100.letterSpacing': '0.0025em',
	'font.100.lineHeight': '16px',
	'font.200.fontSize': '14px',
	'font.200.letterSpacing': '0',
	'font.200.lineHeight': '20px',
	'font.300.fontSize': '16px',
	'font.300.letterSpacing': '0',
	'font.300.lineHeight': '24px',
	'font.400.fontSize': '18px',
	'font.400.letterSpacing': '-0.0025em',
	'font.400.lineHeight': '26px',
	'font.500.fontSize': '20px',
	'font.500.letterSpacing': '-0.005em',
	'font.500.lineHeight': '28px',
	'font.600.fontSize': '24px',
	'font.600.letterSpacing': '-0.00625em',
	'font.600.lineHeight': '30px',
	'font.700.fontSize': '28px',
	'font.700.letterSpacing': '-0.0075em',
	'font.700.lineHeight': '36px',
	'font.800.fontSize': '35px',
	'font.800.letterSpacing': '-0.01em',
	'font.800.lineHeight': '40px',
	'font.900.fontSize': '60px',
	'font.900.letterSpacing': '-0.025em',
	'font.900.lineHeight': '60px',
} as const;

const FONT_METRICS = {
	'apple-system': appleSystemMetrics,
	'dm-sans': dMSansMetrics,
	inter: interMetrics,
} as const;

const ICON_SIZE_VALUES = {
	'iconSize.large': '32px',
	'iconSize.medium': '24px',
	'iconSize.small': '20px',
	'iconSize.xsmall': '16px',
} as const;

interface ModeValues {
	failures: Array<ThemeContrastFailure>;
	values: Record<string, string>;
	diagnostics: ThemeModeDiagnostics;
}

function buildModeValues(mode: ColorMode, modeFoundation: ThemeModeFoundation): ModeValues {
	const { colorValues, familyDiagnostics, surfaces } = buildModeColors(mode, modeFoundation);
	const { checks, failures } = validateContrast(mode, colorValues);
	const values: Record<string, string> = { ...colorValues };
	for (const [name, value] of Object.entries(modeFoundation.depth)) {
		values[`depth.${name}`] = value;
	}
	for (const [name, value] of Object.entries(modeFoundation.actionControlFinish)) {
		values[`actionControlFinish.${name}`] = value;
	}
	return {
		diagnostics: { contrastChecks: checks, families: familyDiagnostics, mode, surfaces },
		failures,
		values,
	};
}

interface ModeColors {
	colorValues: SemanticColorValues;
	familyDiagnostics: Record<FamilyRole, FamilyDiagnostics>;
	surfaces: GeneratedSurfaces;
}

/**
 * Runs the v2 colour pipeline for one mode: resolve source colours and the canvas anchor, generate
 * the six scale families, derive the elevation surfaces, and apply the semantic map. Rethrows a
 * scale-level {@link ScaleGenerationError} as a {@link ThemeGenerationError} carrying the families it
 * had already resolved.
 */
function buildModeColors(mode: ColorMode, modeFoundation: ThemeModeFoundation): ModeColors {
	const source = resolveSourceColors(mode, modeFoundation.color);
	// The canvas anchor drives every family's ramp and the elevation surfaces alike, so a family's
	// subtle steps always ramp away from the same background the surfaces sit on.
	const canvasAnchor = source.background;

	const families = {} as Record<FamilyRole, ScaleFamily>;
	const familyDiagnostics = {} as Record<FamilyRole, FamilyDiagnostics>;
	for (const role of FAMILY_ROLES) {
		try {
			const generated = generateFamilyWithDiagnostics({
				background: canvasAnchor,
				mode,
				role,
				source: source[role],
			});
			families[role] = generated.family;
			familyDiagnostics[role] = generated.diagnostics;
		} catch (error) {
			if (error instanceof ScaleGenerationError) {
				throw new ThemeGenerationError(error, {
					completedFamilies: { ...familyDiagnostics },
					mode,
					role,
				});
			}
			throw error;
		}
	}

	const surfaces = generateSurfaces({ background: canvasAnchor, mode });
	const controlBorder = solveControlBorder({
		canvas: surfaces.canvas,
		mode,
		neutral: families.neutral,
		recessed: surfaces.recessed,
	});
	const colorValues = mapSemanticColors({
		controlBorder,
		families,
		focus: source.focus,
		mode,
		scrim: modeFoundation.color.scrim,
		surfaces,
	});
	return { colorValues, familyDiagnostics, surfaces };
}

/**
 * Solves `color.border.control` as a dedicated contrast boundary (Stage 6 Option B), rather than a
 * subtle step-7 alias: neutral steps 7-8 land at roughly 1.6-2.7:1 against the base surfaces, well
 * short of the 3:1 non-text gate. Starting from step 7's own lightness (its hue and a low, neutral
 * chroma), the search steps in the higher-contrast direction — darker in light mode, lighter in
 * dark mode — until the candidate clears 3:1 (plus headroom) against BOTH `canvas` and `recessed`,
 * gated on whichever of the two currently has the lower contrast. It stops at the first clearing
 * lightness, so the result deviates from the step-7 aesthetic by the minimum needed to reach the
 * boundary. Lightness is clamped to [0, 1]; a neutral hue always reaches the target within range.
 */
function solveControlBorder(params: {
	neutral: ScaleFamily;
	canvas: Oklch;
	recessed: Oklch;
	mode: ColorMode;
}): Oklch {
	const { neutral, canvas, recessed, mode } = params;
	const seed = neutral[7];
	const direction = mode === 'light' ? -1 : 1;
	const target = UI_RATIO + CONTROL_BORDER_HEADROOM;
	const worstRatio = (candidate: Oklch) =>
		Math.min(contrastRatio(candidate, canvas), contrastRatio(candidate, recessed));

	let lightness = seed.l;
	for (;;) {
		const clamped = clampUnit(lightness);
		const candidate = gamutMapOklch({ c: seed.c, h: seed.h, l: clamped });
		if (worstRatio(candidate) >= target || clamped === 0 || clamped === 1) return candidate;
		lightness = clamped + direction * CONTROL_BORDER_SEARCH_STEP;
	}
}

function resolveSourceColors(
	mode: ColorMode,
	colors: ThemeSourceColors,
): Record<(typeof SOURCE_COLOR_FIELDS)[number], Oklch> {
	const defaults = defaultSourceColors[mode];
	const resolve = (value: string) => gamutMapOklch(parseColor(value));
	return {
		accent: resolve(colors.accent),
		background: resolve(colors.background),
		danger: resolve(colors.danger ?? defaults.danger),
		focus: resolve(colors.focus ?? defaults.focus),
		info: resolve(colors.info ?? defaults.info),
		neutral: resolve(colors.neutral),
		success: resolve(colors.success ?? defaults.success),
		warning: resolve(colors.warning ?? defaults.warning),
	};
}

interface ValidationResult {
	failures: Array<ThemeContrastFailure>;
	checks: Array<ContrastCheck>;
}

/**
 * Runs the full semantic validation matrix over the emitted (rounded) colour values. Every pair is
 * recorded as a {@link ContrastCheck}; the AA text/on-solid pairs, the authored focus ring, and
 * `border.control` are hard gates that populate `failures` (which `compileTheme` raises as a
 * {@link ThemeContrastError}). `border.control` is `solveControlBorder`'s dedicated boundary, not a
 * scale-step alias, so it is hard-gated at 3:1 against both base surfaces (Stage 6 Option B). The
 * generated neutral/intent borders (decorative and the per-intent border) still map to the
 * Radix-style step 6/7 (a subtle separator) and stay advisory checks only — v2 deliberately keeps
 * those below the old solver's 3:1 for the reference scale's softer look.
 */
function validateContrast(mode: ColorMode, colorValues: SemanticColorValues): ValidationResult {
	const failures: Array<ThemeContrastFailure> = [];
	const checks: Array<ContrastCheck> = [];
	const colorAt = (path: string): Oklch => {
		const value = colorValues[path];
		if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
		return parseColor(value);
	};
	const check = (foreground: string, background: string, required: number, hard: boolean) => {
		const ratio = contrastRatio(colorAt(foreground), colorAt(background));
		const passes = ratio >= required;
		checks.push({ background, foreground, passes, ratio, required });
		if (hard && !passes) failures.push({ background, foreground, mode, ratio, required });
	};

	// v2 validates only against surfaces consumers can reference (the hidden `resting` rung is gone).
	const surfacePaths = ['canvas', 'recessed', 'floating', 'overlay'].map(
		(surface) => `color.surface.${surface}`,
	);
	const basePaths = ['color.surface.canvas', 'color.surface.recessed'];
	const actionTextBackgrounds = (intent: string) => [
		...basePaths,
		`color.intent.${intent}.surface.subtle`,
		`color.intent.${intent}.surface.subtleHover`,
		`color.intent.${intent}.surface.subtlePressed`,
	];
	const feedbackTextBackgrounds = (intent: string) => [
		...basePaths,
		`color.intent.${intent}.surface.subtle`,
	];

	// Global text vs every mapped elevation surface, plus the neutral subtle trio behind neutral
	// controls and the neutral/gray badge (carried from #137/#139).
	for (const text of ['color.text.primary', 'color.text.secondary']) {
		for (const surface of surfacePaths) check(text, surface, TEXT_RATIO, true);
	}
	for (const state of ['subtle', 'subtleHover', 'subtlePressed']) {
		check('color.text.primary', `color.intent.neutral.surface.${state}`, TEXT_RATIO, true);
	}
	// Accent/danger text (and accent textHover) vs the base surfaces and their own subtle trio.
	for (const intent of BORDER_AND_TEXT_INTENTS) {
		for (const background of actionTextBackgrounds(intent)) {
			check(`color.intent.${intent}.text`, background, TEXT_RATIO, true);
		}
	}
	for (const background of actionTextBackgrounds('accent')) {
		check('color.intent.accent.textHover', background, TEXT_RATIO, true);
	}
	// Feedback text vs the base surfaces and its single subtle surface.
	for (const intent of FEEDBACK_INTENTS) {
		for (const background of feedbackTextBackgrounds(intent)) {
			check(`color.intent.${intent}.text`, background, TEXT_RATIO, true);
		}
	}
	// On-solid text vs the solid ladder — the scale generator already guarantees this for the action
	// intents; revalidated here on the emitted values.
	for (const intent of ACTION_INTENTS) {
		for (const state of ['solid', 'solidHover', 'solidPressed']) {
			check(
				`color.intent.${intent}.onSolid`,
				`color.intent.${intent}.surface.${state}`,
				TEXT_RATIO,
				true,
			);
		}
	}
	// The keyboard-focus ring is authored and focus-visibility critical, so it stays a hard 3:1 gate.
	for (const background of basePaths) check('color.border.focus', background, UI_RATIO, true);
	// border.control is a solved contrast boundary (Stage 6 Option B): hard-gated at 3:1 against both
	// base surfaces in both modes. Decorative and intent borders (step 6/7) stay advisory Radix-style
	// separators below 3:1.
	for (const background of basePaths) check('color.border.control', background, UI_RATIO, true);
	for (const intent of [...BORDER_AND_TEXT_INTENTS, ...FEEDBACK_INTENTS]) {
		for (const background of basePaths) {
			check(`color.intent.${intent}.border`, background, UI_RATIO, false);
		}
	}

	return { checks, failures };
}

function validateFoundation(foundation: ThemeFoundation): void {
	const issues: Array<string> = [];
	try {
		themeClassName(foundation.name);
	} catch (error) {
		issues.push(`name: ${errorMessage(error)}`);
	}
	for (const mode of ['light', 'dark'] as const) {
		const modeFoundation = foundation[mode];
		for (const field of SOURCE_COLOR_FIELDS) {
			const value = modeFoundation.color[field];
			if (value === undefined) continue;
			try {
				parseColor(value);
			} catch (error) {
				issues.push(`${mode}.color.${field}: ${errorMessage(error)}`);
			}
		}
		for (const [name, value] of Object.entries(modeFoundation.depth)) {
			if (value.trim() === '' || /[;{}]/.test(value)) {
				issues.push(`${mode}.depth.${name}: must be a non-empty CSS box-shadow value`);
			}
		}
		for (const [name, value] of Object.entries(modeFoundation.actionControlFinish)) {
			if (value.trim() === '' || /[;{}]/.test(value)) {
				issues.push(
					`${mode}.actionControlFinish.${name}: must be a non-empty CSS background-image value`,
				);
			}
		}
	}
	const fontFamily = foundation.typography?.fontFamily;
	if (fontFamily !== undefined && !(fontFamily in themeFontFamilyStacks)) {
		issues.push(`typography.fontFamily: "${fontFamily}" is not a curated font-family choice`);
	}
	const fontWeight = foundation.typography?.fontWeight;
	if (fontWeight !== undefined) {
		for (const role of ['body', 'label', 'heading', 'emphasis'] as const) {
			const value = fontWeight[role];
			if (value === undefined) continue;
			if (!Number.isFinite(value) || value < 1 || value > 1000) {
				issues.push(`typography.fontWeight.${role}: must be a number between 1 and 1000`);
			}
		}
	}
	if (foundation.radius !== undefined) {
		for (const role of ['detail', 'control', 'surface', 'overlay'] as const) {
			const value = foundation.radius[role];
			if (value === undefined) continue;
			if (!Number.isFinite(value) || value < 0) {
				issues.push(`radius.${role}: must be a number of pixels, 0 or greater`);
			}
		}
	}
	if (issues.length > 0) {
		throw new Error(`Invalid theme foundation:\n${issues.join('\n')}`);
	}
}

function assembleStylesheet(
	foundation: ThemeFoundation,
	lightValues: Record<string, string>,
	darkValues: Record<string, string>,
): string {
	const selector = `.${themeClassName(foundation.name)}`;
	const pairs = flattenThemeContract();
	const isModePath = (path: string) => {
		return (
			path.startsWith('actionControlFinish.') ||
			path.startsWith('color.') ||
			path.startsWith('depth.')
		);
	};
	const identityPairs = pairs.filter(([path]) => !isModePath(path));
	const modePairs = pairs.filter(([path]) => isModePath(path));

	const identityDeclarations = declarations(identityPairs, buildIdentityValues(foundation));
	const lightDeclarations = ['color-scheme: light;', ...declarations(modePairs, lightValues)];
	const darkDeclarations = ['color-scheme: dark;', ...declarations(modePairs, darkValues)];

	// Without data-color-mode, the base light rule plus the prefers-color-scheme media query follow
	// the system preference. The explicit attribute rules are specificity (0,2,0), so they beat the
	// (0,1,0) media-query rule whether the attribute sits on the theme root, inside its subtree, or
	// on an ancestor. Every scope sets native color-scheme, and the output is unlayered on purpose.
	const attributeSelectors = (attributeMode: ColorMode) => {
		return [
			`${selector}[data-color-mode='${attributeMode}'],`,
			`${selector} [data-color-mode='${attributeMode}'],`,
			`[data-color-mode='${attributeMode}'] ${selector} {`,
		].join('\n');
	};

	return [
		'/* Generated by buildTheme from @luke-ui/react. Do not edit. */',
		`${selector} {`,
		...identityDeclarations.map(indent),
		'}',
		'',
		`${selector} {`,
		...lightDeclarations.map(indent),
		'}',
		'',
		'@media (prefers-color-scheme: dark) {',
		indent(`${selector} {`),
		...darkDeclarations.map(indent).map(indent),
		indent('}'),
		'}',
		'',
		attributeSelectors('light'),
		...lightDeclarations.map(indent),
		'}',
		'',
		attributeSelectors('dark'),
		...darkDeclarations.map(indent),
		'}',
		'',
	].join('\n');
}

function buildIdentityValues(foundation: ThemeFoundation): Record<string, string> {
	const fontFamily = foundation.typography?.fontFamily ?? defaultFontFamily;
	const fontWeight = foundation.typography?.fontWeight;
	const radius = foundation.radius;
	const values: Record<string, string> = {
		'controlSize.medium': '40px',
		'controlSize.small': '32px',
		...FONT_VALUES,
		...buildCapsizeValues(fontFamily),
		'font.family': themeFontFamilyStacks[fontFamily],
		'font.weight.body': String(fontWeight?.body ?? defaultFontWeights.body),
		'font.weight.emphasis': String(fontWeight?.emphasis ?? defaultFontWeights.emphasis),
		'font.weight.heading': String(fontWeight?.heading ?? defaultFontWeights.heading),
		'font.weight.label': String(fontWeight?.label ?? defaultFontWeights.label),
		'radius.control': `${radius?.control ?? defaultRadius.control}px`,
		'radius.detail': `${radius?.detail ?? defaultRadius.detail}px`,
		'radius.full': '9999px',
		'radius.overlay': `${radius?.overlay ?? defaultRadius.overlay}px`,
		'radius.surface': `${radius?.surface ?? defaultRadius.surface}px`,
		...ICON_SIZE_VALUES,
		...MOTION_VALUES,
	};
	for (const [step, value] of Object.entries(SPACE_VALUES)) {
		values[`space.${step}`] = value;
	}
	return values;
}

function buildCapsizeValues(fontFamily: keyof typeof FONT_METRICS): Record<string, string> {
	const values: Record<string, string> = {};
	for (const step of fontSizeSteps) {
		const fontSize = Number.parseFloat(FONT_VALUES[`font.${step}.fontSize`]);
		const leading = Number.parseFloat(FONT_VALUES[`font.${step}.lineHeight`]);
		const { baselineTrim, capHeightTrim } = precomputeValues({
			fontMetrics: FONT_METRICS[fontFamily],
			fontSize,
			leading,
		});
		values[`font.${step}.baselineTrim`] = baselineTrim;
		values[`font.${step}.capHeightTrim`] = capHeightTrim;
	}
	return values;
}

function declarations(
	pairs: Array<[path: string, varName: string]>,
	values: Record<string, string>,
): Array<string> {
	return pairs.map(([path, varName]) => {
		const value = values[path];
		if (value === undefined) throw new Error(`buildTheme did not generate a value for "${path}"`);
		return `${varName}: ${value};`;
	});
}

function indent(line: string): string {
	return `\t${line}`;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
