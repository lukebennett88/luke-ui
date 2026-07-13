import type { Oklch } from './color.js';
import { contrastRatio, formatOklch, gamutMapOklch, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import type { ThemeFoundation, ThemeModeFoundation, ThemeSourceColors } from './foundation.js';
import {
	defaultFontFamily,
	defaultFontWeights,
	defaultRadius,
	defaultSourceColors,
	themeFontFamilyStacks,
} from './foundation.js';

/**
 * Compiles a theme foundation into a complete static stylesheet.
 *
 * Pure and Node-compatible: no vanilla-extract, no DOM, and deterministic output. Returns
 * stylesheet text containing the theme identity class plus both colour-mode blocks, selected by
 * `data-color-mode` with `prefers-color-scheme` as the fallback. Throws {@link ThemeContrastError}
 * naming the mode and token pair when any generated pair misses WCAG 2.2 AA (4.5:1 for text pairs,
 * 3:1 for non-text UI pairs). Colours are computed and emitted in OKLCH.
 */
export function buildTheme(foundation: ThemeFoundation): string {
	validateFoundation(foundation);
	const light = buildModeValues('light', foundation.light);
	const dark = buildModeValues('dark', foundation.dark);
	const failures = [...light.failures, ...dark.failures];
	if (failures.length > 0) throw new ThemeContrastError(failures);
	return assembleStylesheet(foundation, light.values, dark.values);
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
				...failures.map(
					(failure) =>
						`${failure.mode}: ${failure.foreground} on ${failure.background} — ` +
						`${failure.ratio.toFixed(2)}:1 < ${failure.required}:1`,
				),
			].join('\n'),
		);
		this.failures = failures;
		this.name = 'ThemeContrastError';
	}
}

type ColorMode = 'light' | 'dark';

const THEME_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const TEXT_RATIO = 4.5;
const UI_RATIO = 3;
// Solve slightly past the required ratio so 4-decimal OKLCH emission cannot round a passing pair
// below the WCAG threshold.
const RATIO_HEADROOM = 0.05;

const INTENT_NAMES = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const;
const FULL_KIT_INTENTS = ['accent', 'info', 'success', 'warning', 'danger'] as const;
const SOURCE_COLOR_FIELDS = [
	'neutral',
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
	'motion.duration.ambient': '800ms',
	'motion.duration.fast': '120ms',
	'motion.duration.medium': '200ms',
	'motion.duration.slow': '300ms',
	'motion.easing.enter': 'cubic-bezier(0, 0, 0, 1)',
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

const ICON_SIZE_VALUES = {
	'iconSize.large': '32px',
	'iconSize.medium': '24px',
	'iconSize.small': '20px',
	'iconSize.xsmall': '16px',
} as const;

interface LightnessWindows {
	borderControl: [number, number];
	intentBorder: [number, number];
	intentText: [number, number];
	textPrimary: [number, number];
	textSecondary: [number, number];
}

// Windows encode mode character: dark-mode text must stay light and light-mode text must stay
// dark, so an unworkable source colour becomes an honest contrast failure at the window edge
// instead of an off-character colour.
const LIGHTNESS_WINDOWS: Record<ColorMode, LightnessWindows> = {
	dark: {
		borderControl: [0.5, 0.8],
		intentBorder: [0.5, 0.85],
		intentText: [0.62, 0.92],
		textPrimary: [0.8, 0.98],
		textSecondary: [0.68, 0.88],
	},
	light: {
		borderControl: [0.35, 0.62],
		intentBorder: [0.38, 0.62],
		intentText: [0.25, 0.56],
		textPrimary: [0.1, 0.35],
		textSecondary: [0.3, 0.52],
	},
};

interface ModeValues {
	failures: Array<ThemeContrastFailure>;
	values: Record<string, string>;
}

function buildModeValues(mode: ColorMode, modeFoundation: ThemeModeFoundation): ModeValues {
	const colors = buildModeColors(mode, modeFoundation);
	const failures = validateContrast(mode, colors);
	const values: Record<string, string> = {};
	for (const [path, color] of Object.entries(colors)) {
		values[path] = formatOklch(color);
	}
	for (const [name, value] of Object.entries(modeFoundation.depth)) {
		values[`depth.${name}`] = value;
	}
	return { failures, values };
}

function buildModeColors(
	mode: ColorMode,
	modeFoundation: ThemeModeFoundation,
): Record<string, Oklch> {
	const isLight = mode === 'light';
	const windows = LIGHTNESS_WINDOWS[mode];
	const source = resolveSourceColors(mode, modeFoundation.color);
	const neutral = source.neutral;
	const neutralChroma = Math.min(neutral.c, 0.02);

	const canvas = gamutMapOklch({ ...neutral, c: Math.min(neutral.c, 0.015) });
	const surfaceAt = (delta: number) => gamutMapOklch({ ...canvas, l: clampUnit(canvas.l + delta) });
	const surfaces = isLight
		? {
				canvas,
				floating: surfaceAt(0.012),
				overlay: surfaceAt(0.015),
				recessed: surfaceAt(-0.035),
				resting: surfaceAt(0.012),
			}
		: {
				canvas,
				floating: surfaceAt(0.07),
				overlay: surfaceAt(0.09),
				recessed: surfaceAt(-0.025),
				resting: surfaceAt(0.04),
			};
	const allSurfaces = [
		surfaces.canvas,
		surfaces.resting,
		surfaces.recessed,
		surfaces.floating,
		surfaces.overlay,
	];
	const baseSurfaces = [surfaces.canvas, surfaces.resting, surfaces.recessed];

	const colors: Record<string, Oklch> = {
		'color.surface.canvas': surfaces.canvas,
		'color.surface.resting': surfaces.resting,
		'color.surface.recessed': surfaces.recessed,
		'color.surface.floating': surfaces.floating,
		'color.surface.overlay': surfaces.overlay,
	};

	colors['color.text.primary'] = solveLightness({
		backgrounds: allSurfaces,
		chroma: neutralChroma,
		hue: neutral.h,
		mode,
		ratio: TEXT_RATIO,
		startLightness: midpoint(windows.textPrimary),
		window: windows.textPrimary,
	});
	colors['color.text.secondary'] = solveLightness({
		backgrounds: allSurfaces,
		chroma: neutralChroma,
		hue: neutral.h,
		mode,
		ratio: TEXT_RATIO,
		startLightness: midpoint(windows.textSecondary),
		window: windows.textSecondary,
	});
	colors['color.border.control'] = solveLightness({
		backgrounds: baseSurfaces,
		chroma: neutralChroma,
		hue: neutral.h,
		mode,
		ratio: UI_RATIO,
		startLightness: midpoint(windows.borderControl),
		window: windows.borderControl,
	});
	colors['color.border.decorative'] = gamutMapOklch({
		c: neutralChroma,
		h: neutral.h,
		l: clampUnit(canvas.l + (isLight ? -0.08 : 0.1)),
	});
	colors['color.border.focus'] = source.focus;

	// Disabled roles are exempt from contrast checks but must remain perceptibly disabled.
	const disabledChroma = Math.min(neutral.c, 0.01);
	const disabledAt = (delta: number) =>
		gamutMapOklch({ c: disabledChroma, h: neutral.h, l: clampUnit(canvas.l + delta) });
	colors['color.surfaceDisabled'] = disabledAt(isLight ? -0.06 : 0.05);
	colors['color.textDisabled'] = disabledAt(isLight ? -0.32 : 0.33);
	colors['color.borderDisabled'] = disabledAt(isLight ? -0.12 : 0.14);

	for (const intent of FULL_KIT_INTENTS) {
		const intentSource = source[intent];
		const kit = buildIntentKit(mode, canvas, baseSurfaces, intentSource, windows);
		for (const [key, value] of Object.entries(kit)) {
			colors[`color.intent.${intent}.${key}`] = value;
		}
	}

	const accentText = colors['color.intent.accent.text'];
	if (accentText !== undefined) {
		colors['color.intent.accent.textHover'] = gamutMapOklch({
			...accentText,
			l: clampUnit(accentText.l + (isLight ? -0.06 : 0.06)),
		});
	}

	const neutralSolid = gamutMapOklch({
		c: neutralChroma,
		h: neutral.h,
		l: isLight ? 0.32 : 0.85,
	});
	const neutralSolidAt = (delta: number) =>
		gamutMapOklch({ ...neutralSolid, l: clampUnit(neutralSolid.l + (isLight ? -delta : delta)) });
	const neutralSolidHover = neutralSolidAt(0.05);
	const neutralSolidPressed = neutralSolidAt(0.09);
	const neutralSubtle = buildSubtleTrio(mode, canvas, neutral);
	colors['color.intent.neutral.surface.subtle'] = neutralSubtle.subtle;
	colors['color.intent.neutral.surface.subtleHover'] = neutralSubtle.subtleHover;
	colors['color.intent.neutral.surface.subtlePressed'] = neutralSubtle.subtlePressed;
	colors['color.intent.neutral.surface.solid'] = neutralSolid;
	colors['color.intent.neutral.surface.solidHover'] = neutralSolidHover;
	colors['color.intent.neutral.surface.solidPressed'] = neutralSolidPressed;
	colors['color.intent.neutral.onSolid'] = chooseOnSolid(neutral.h, [
		neutralSolid,
		neutralSolidHover,
		neutralSolidPressed,
	]);

	return colors;
}

interface IntentKit {
	border: Oklch;
	onSolid: Oklch;
	'surface.solid': Oklch;
	'surface.solidHover': Oklch;
	'surface.solidPressed': Oklch;
	'surface.subtle': Oklch;
	'surface.subtleHover': Oklch;
	'surface.subtlePressed': Oklch;
	text: Oklch;
}

function buildIntentKit(
	mode: ColorMode,
	canvas: Oklch,
	baseSurfaces: Array<Oklch>,
	source: Oklch,
	windows: LightnessWindows,
): IntentKit {
	const isLight = mode === 'light';
	const hoverDirection = isLight ? -1 : 1;
	const solid = source;
	const solidHover = gamutMapOklch({ ...solid, l: clampUnit(solid.l + 0.05 * hoverDirection) });
	const solidPressed = gamutMapOklch({ ...solid, l: clampUnit(solid.l + 0.09 * hoverDirection) });
	const subtle = buildSubtleTrio(mode, canvas, source);
	const text = solveLightness({
		backgrounds: [...baseSurfaces, subtle.subtle, subtle.subtleHover, subtle.subtlePressed],
		chroma: Math.min(source.c, 0.13),
		hue: source.h,
		mode,
		ratio: TEXT_RATIO,
		startLightness: source.l,
		window: windows.intentText,
	});
	const border = solveLightness({
		backgrounds: baseSurfaces,
		chroma: Math.min(source.c, 0.12),
		hue: source.h,
		mode,
		ratio: UI_RATIO,
		startLightness: source.l,
		window: windows.intentBorder,
	});
	return {
		border,
		onSolid: chooseOnSolid(source.h, [solid, solidHover, solidPressed]),
		'surface.solid': solid,
		'surface.solidHover': solidHover,
		'surface.solidPressed': solidPressed,
		'surface.subtle': subtle.subtle,
		'surface.subtleHover': subtle.subtleHover,
		'surface.subtlePressed': subtle.subtlePressed,
		text,
	};
}

function buildSubtleTrio(
	mode: ColorMode,
	canvas: Oklch,
	source: Oklch,
): { subtle: Oklch; subtleHover: Oklch; subtlePressed: Oklch } {
	const isLight = mode === 'light';
	const chroma = Math.min(0.35 * source.c, 0.06);
	const at = (delta: number) =>
		gamutMapOklch({ c: chroma, h: source.h, l: clampUnit(canvas.l + delta) });
	return isLight
		? { subtle: at(-0.045), subtleHover: at(-0.07), subtlePressed: at(-0.1) }
		: { subtle: at(0.06), subtleHover: at(0.09), subtlePressed: at(0.12) };
}

function chooseOnSolid(hue: number, solids: Array<Oklch>): Oklch {
	const nearWhite = gamutMapOklch({ c: 0, h: hue, l: 0.985 });
	const nearBlack = gamutMapOklch({ c: 0.01, h: hue, l: 0.18 });
	const whiteMinimum = minimumRatio(nearWhite, solids);
	const blackMinimum = minimumRatio(nearBlack, solids);
	if (whiteMinimum >= TEXT_RATIO + RATIO_HEADROOM) return nearWhite;
	if (blackMinimum >= TEXT_RATIO + RATIO_HEADROOM) return nearBlack;
	return whiteMinimum >= blackMinimum ? nearWhite : nearBlack;
}

interface LightnessSolveRequest {
	backgrounds: Array<Oklch>;
	chroma: number;
	hue: number;
	mode: ColorMode;
	ratio: number;
	startLightness: number;
	window: [number, number];
}

/**
 * Finds a lightness inside the window that satisfies every contrast constraint, moving as little
 * as possible from the start lightness. When even the window's high-contrast edge fails, returns
 * the edge colour so the validation matrix records the achieved ratio.
 */
function solveLightness(request: LightnessSolveRequest): Oklch {
	const [low, high] = request.window;
	const makeColor = (l: number) => gamutMapOklch({ c: request.chroma, h: request.hue, l });
	const target = request.ratio + RATIO_HEADROOM;
	const passes = (l: number) => minimumRatio(makeColor(l), request.backgrounds) >= target;
	const start = clamp(request.startLightness, low, high);
	if (passes(start)) return makeColor(start);
	// Contrast improves toward darker lightness in light mode and lighter lightness in dark mode.
	const edge = request.mode === 'light' ? low : high;
	if (!passes(edge)) return makeColor(edge);
	let passing = edge;
	let failing = start;
	for (let iteration = 0; iteration < 30; iteration++) {
		const mid = (passing + failing) / 2;
		if (passes(mid)) {
			passing = mid;
		} else {
			failing = mid;
		}
	}
	return makeColor(passing);
}

function minimumRatio(foreground: Oklch, backgrounds: Array<Oklch>): number {
	return Math.min(...backgrounds.map((background) => contrastRatio(foreground, background)));
}

function resolveSourceColors(
	mode: ColorMode,
	colors: ThemeSourceColors,
): Record<(typeof SOURCE_COLOR_FIELDS)[number], Oklch> {
	const defaults = defaultSourceColors[mode];
	const resolve = (value: string) => gamutMapOklch(parseColor(value));
	return {
		accent: resolve(colors.accent),
		danger: resolve(colors.danger ?? defaults.danger),
		focus: resolve(colors.focus ?? defaults.focus),
		info: resolve(colors.info ?? defaults.info),
		neutral: resolve(colors.neutral),
		success: resolve(colors.success ?? defaults.success),
		warning: resolve(colors.warning ?? defaults.warning),
	};
}

function validateContrast(
	mode: ColorMode,
	colors: Record<string, Oklch>,
): Array<ThemeContrastFailure> {
	const failures: Array<ThemeContrastFailure> = [];
	const colorAt = (path: string): Oklch => {
		const value = colors[path];
		if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
		return value;
	};
	const check = (foreground: string, background: string, required: number) => {
		const ratio = contrastRatio(colorAt(foreground), colorAt(background));
		if (ratio < required) failures.push({ background, foreground, mode, ratio, required });
	};

	const surfacePaths = ['canvas', 'resting', 'recessed', 'floating', 'overlay'].map(
		(surface) => `color.surface.${surface}`,
	);
	const intentBackgroundPaths = (intent: string) => [
		'color.surface.canvas',
		'color.surface.resting',
		'color.surface.recessed',
		`color.intent.${intent}.surface.subtle`,
		`color.intent.${intent}.surface.subtleHover`,
		`color.intent.${intent}.surface.subtlePressed`,
	];
	const basePaths = ['color.surface.canvas', 'color.surface.resting', 'color.surface.recessed'];

	for (const text of ['color.text.primary', 'color.text.secondary']) {
		for (const surface of surfacePaths) check(text, surface, TEXT_RATIO);
	}
	for (const intent of FULL_KIT_INTENTS) {
		for (const background of intentBackgroundPaths(intent)) {
			check(`color.intent.${intent}.text`, background, TEXT_RATIO);
		}
	}
	for (const background of intentBackgroundPaths('accent')) {
		check('color.intent.accent.textHover', background, TEXT_RATIO);
	}
	for (const intent of INTENT_NAMES) {
		for (const state of ['solid', 'solidHover', 'solidPressed']) {
			check(
				`color.intent.${intent}.onSolid`,
				`color.intent.${intent}.surface.${state}`,
				TEXT_RATIO,
			);
		}
	}
	for (const background of basePaths) check('color.border.control', background, UI_RATIO);
	for (const background of basePaths.slice(0, 2)) check('color.border.focus', background, UI_RATIO);
	for (const intent of FULL_KIT_INTENTS) {
		for (const background of basePaths)
			check(`color.intent.${intent}.border`, background, UI_RATIO);
	}

	return failures;
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
	const isModePath = (path: string) => path.startsWith('color.') || path.startsWith('depth.');
	const identityPairs = pairs.filter(([path]) => !isModePath(path));
	const modePairs = pairs.filter(([path]) => isModePath(path));

	const identityDeclarations = declarations(identityPairs, buildIdentityValues(foundation));
	const lightDeclarations = ['color-scheme: light;', ...declarations(modePairs, lightValues)];
	const darkDeclarations = ['color-scheme: dark;', ...declarations(modePairs, darkValues)];

	// Without data-color-mode, the base light rule plus the prefers-color-scheme media query follow
	// the system preference. The explicit attribute rules are specificity (0,2,0), so they beat the
	// (0,1,0) media-query rule whether the attribute sits on the theme root, inside its subtree, or
	// on an ancestor. Every scope sets native color-scheme, and the output is unlayered on purpose.
	const attributeSelectors = (attributeMode: ColorMode) =>
		[
			`${selector}[data-color-mode='${attributeMode}'],`,
			`${selector} [data-color-mode='${attributeMode}'],`,
			`[data-color-mode='${attributeMode}'] ${selector} {`,
		].join('\n');

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

function midpoint([low, high]: [number, number]): number {
	return (low + high) / 2;
}

function clamp(value: number, low: number, high: number): number {
	return Math.min(high, Math.max(low, value));
}

function clampUnit(value: number): number {
	return clamp(value, 0, 1);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
