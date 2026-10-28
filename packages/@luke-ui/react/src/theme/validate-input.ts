/** Validates authored theme fields before compilation. */

import { parseColor } from './color.js';
import type { ThemeInput } from './define-theme.js';
import { SOURCE_COLOR_FIELDS, SURFACE_ROLES } from './foundation.js';
import { getThemeClassName } from './theme-class-name.js';
import { fontWeightRoles } from './type-styles.js';
import { isInvalidRadius, isUnsafeCssValue } from './validate-foundation.js';

/** One problem in a theme input. */
interface ThemeValidationIssue {
	/** Name of the input that contains the problem. */
	theme: string;
	/** Dot path within that input, for example `typography.fonts.body.metrics.unitsPerEm`. */
	path: string;
	/** What is wrong with the value at `path`. */
	message: string;
}

/**
 * Thrown by `defineTheme` when a theme input is invalid. Reports every issue at once.
 */
export class ThemeValidationError extends Error {
	/** Every issue found in the input. */
	readonly issues: ReadonlyArray<ThemeValidationIssue>;

	constructor(issues: ReadonlyArray<ThemeValidationIssue>) {
		super(
			[
				'Invalid theme input:',
				...issues.map((issue) => `Theme "${issue.theme}", ${issue.path}: ${issue.message}`),
			].join('\n'),
		);
		this.issues = issues;
		this.name = 'ThemeValidationError';
	}
}

/** Checks authored fields and required values. */
export function validateThemeInput(input: ThemeInput): Array<ThemeValidationIssue> {
	const issues: Array<ThemeValidationIssue> = [];
	function report(path: string, message: string) {
		issues.push({ message, path, theme: String(input.name) });
	}

	if (typeof input.name !== 'string') {
		report('name', 'must be a kebab-case string');
	} else {
		try {
			getThemeClassName(input.name);
		} catch (error) {
			report('name', error instanceof Error ? error.message : String(error));
		}
	}
	const color: unknown = input.color;
	if (color === undefined || (isRecord(color) && color.accent === undefined))
		report('color.accent', 'is required');
	const authoredTypography: unknown = input.typography;
	if (
		authoredTypography === undefined ||
		(isRecord(authoredTypography) &&
			(authoredTypography.fonts === undefined ||
				(isRecord(authoredTypography.fonts) && authoredTypography.fonts.body === undefined)))
	) {
		report('typography.fonts.body', 'is required');
	}
	validateColors(input.color, report);
	validateMaterials(input.shadow, 'shadow', 'box-shadow', report);
	validateMaterials(input.controlFinish, 'controlFinish', 'background-image', report);
	const radius: unknown = input.radius;
	if (radius !== undefined) {
		if (isRecord(radius)) {
			for (const role of ['detail', 'control', 'surface', 'overlay'] as const) {
				if (radius[role] !== undefined && isInvalidRadius(radius[role])) {
					report(`radius.${role}`, 'must be a number of pixels, 0 or greater');
				}
			}
		} else {
			report('radius', 'must be an object');
		}
	}

	const typography: unknown = input.typography;
	if (typography === undefined) return issues;
	if (!isRecord(typography)) {
		report('typography', 'must be an object');
		return issues;
	}

	const fonts = typography.fonts;
	if (fonts !== undefined) {
		if (isRecord(fonts)) {
			if (fonts.body === null) report('typography.fonts.body', 'cannot be null');
			else if (fonts.body !== undefined) validateFont(fonts.body, 'typography.fonts.body', report);
			if (fonts.code !== undefined) validateFontFamily(fonts.code, 'typography.fonts.code', report);
			if (fonts.display !== undefined && fonts.display !== null) {
				validateFont(fonts.display, 'typography.fonts.display', report);
			}
		} else {
			report('typography.fonts', 'must be an object');
		}
	}

	const fontWeight = typography.fontWeight;
	if (fontWeight !== undefined) {
		if (isRecord(fontWeight)) {
			for (const role of fontWeightRoles) {
				const value = fontWeight[role];
				if (value === undefined) continue;
				if (!isFiniteNumber(value) || value < 1 || value > 1000) {
					report(`typography.fontWeight.${role}`, 'must be a number from 1 to 1000');
				}
			}
		} else {
			report('typography.fontWeight', 'must be an object');
		}
	}
	return issues;
}

function validateColors(color: unknown, report: (path: string, message: string) => void): void {
	if (color === undefined) return;
	if (!isRecord(color)) {
		report('color', 'must be an object');
		return;
	}
	for (const role of SOURCE_COLOR_FIELDS) {
		if (role !== 'neutral') validateColorRole(color[role], `color.${role}`, true, report);
	}
	validateNeutral(color.neutral, report);
	if (Object.hasOwn(color, 'neutralStyle')) {
		report('color.neutralStyle', 'is unsupported; use color.neutral with a style');
	}
	validateColorRole(color.backdrop, 'color.backdrop', true, report);
	const surface = color.surface;
	if (surface === undefined) return;
	if (!isRecord(surface)) {
		report('color.surface', 'must be an object');
		return;
	}
	if (Object.hasOwn(surface, 'field')) {
		report('color.surface.field', 'is an unsupported surface; use color.surface.base');
	}
	for (const role of SURFACE_ROLES) {
		validateColorRole(surface[role], `color.surface.${role}`, role === 'base', report);
	}
}

function validateNeutral(value: unknown, report: (path: string, message: string) => void): void {
	if (value === undefined || typeof value === 'string') {
		validateColorRole(value, 'color.neutral', true, report);
		return;
	}
	if (!isRecord(value)) {
		report(
			'color.neutral',
			'must be a colour string or a light/dark object, or a curated style object',
		);
		return;
	}
	for (const key of Object.keys(value)) {
		if (key !== 'style' && key !== 'light' && key !== 'dark') {
			report(`color.neutral.${key}`, 'is unsupported');
		}
	}
	if (Object.hasOwn(value, 'style')) {
		if (Object.hasOwn(value, 'light') || Object.hasOwn(value, 'dark')) {
			report('color.neutral', 'choose either a style or light/dark colours, not both');
		}
		if (value.style !== 'neutral' && value.style !== 'warm' && value.style !== 'cool') {
			report('color.neutral.style', 'must be neutral, warm, or cool');
		}
		return;
	}
	validateColorRole(value, 'color.neutral', true, report);
}

function validateColorRole(
	value: unknown,
	path: string,
	acceptsString: boolean,
	report: (path: string, message: string) => void,
): void {
	if (value === undefined) return;
	if (acceptsString && typeof value === 'string') {
		validateColor(value, path, report);
		return;
	}
	if (!isRecord(value)) {
		report(
			path,
			acceptsString
				? 'must be a colour string or a light/dark object'
				: 'must be a light/dark object',
		);
		return;
	}
	if (path === 'color.accent' && value.light === undefined && value.dark === undefined) {
		report(path, 'must provide a colour for at least one of light or dark');
	}
	for (const mode of ['light', 'dark'] as const) {
		if (value[mode] !== undefined) validateColor(value[mode], `${path}.${mode}`, report);
	}
}

function validateColor(
	value: unknown,
	path: string,
	report: (path: string, message: string) => void,
): void {
	if (path === 'color.backdrop' || path.startsWith('color.backdrop.')) {
		if (isUnsafeCssValue(value))
			report(path, 'must be a non-empty CSS colour value without `;`, `{`, or `}`');
		return;
	}
	if (typeof value !== 'string') {
		report(path, 'must be a colour string');
		return;
	}
	try {
		parseColor(value);
	} catch (error) {
		report(path, error instanceof Error ? error.message : String(error));
	}
}

function validateMaterials(
	value: unknown,
	path: string,
	property: string,
	report: (path: string, message: string) => void,
): void {
	if (value === undefined) return;
	if (!isRecord(value)) {
		report(path, 'must be an object');
		return;
	}
	for (const mode of ['light', 'dark'] as const) {
		const ladder = value[mode];
		if (ladder === undefined) continue;
		if (!isRecord(ladder)) {
			report(`${path}.${mode}`, 'must be an object');
			continue;
		}
		for (const [rung, css] of Object.entries(ladder)) {
			if (css !== undefined && isUnsafeCssValue(css)) {
				report(
					`${path}.${mode}.${rung}`,
					`must be a non-empty CSS ${property} value without \`;\`, \`{\`, or \`}\``,
				);
			}
		}
	}
}

/** The metrics Capsize needs to trim text. Each must be a finite number. */
const REQUIRED_METRICS = ['ascent', 'capHeight', 'descent', 'lineGap', 'unitsPerEm'] as const;

/** Optional numeric metrics. Each must be a finite number when present. */
const OPTIONAL_METRICS = ['xHeight', 'xWidthAvg'] as const;

/**
 * Text that would let a family break out of its declaration or the stylesheet: a declaration or
 * block delimiter, the start of a tag, a control character, a backslash, which can escape the
 * closing quote or `;`, or a comment delimiter, which can hide every declaration after it.
 */
// Reject control characters before font-family values reach CSS.
// oxlint-disable-next-line eslint/no-control-regex
const UNSAFE_FAMILY_PATTERN = /[;{}<\\\u0000-\u001F\u007F]|\/\*|\*\//;

/** A quoted family name. A backslash is unsafe, so a quote inside the name can't be escaped. */
const QUOTED_FAMILY_PATTERN = /'[^']*'|"[^"]*"/g;

/** One word of an unquoted family name: a CSS identifier without escapes. */
const IDENTIFIER_PATTERN = /^(?:--|-?[a-z_\u0080-\u{10FFFF}])[\w\u0080-\u{10FFFF}-]*$/iu;

/** Valid alone in `font-family`, but they name no font, so a theme can't use them as a family. */
const RESERVED_KEYWORDS = new Set([
	'default',
	'inherit',
	'initial',
	'revert',
	'revert-layer',
	'unset',
]);

/** Generic families. An unquoted name can't start with one, so `serif Pro` must be quoted. */
const GENERIC_FAMILIES = new Set([
	'cursive',
	'emoji',
	'fangsong',
	'fantasy',
	'math',
	'monospace',
	'sans-serif',
	'serif',
	'system-ui',
	'ui-monospace',
	'ui-rounded',
	'ui-sans-serif',
	'ui-serif',
]);

function validateFont(
	font: unknown,
	path: string,
	report: (path: string, message: string) => void,
): void {
	if (!isRecord(font)) {
		report(path, 'must be an object with `family` and `metrics`');
		return;
	}
	const { family, metrics } = font;
	validateFontFamily(family, `${path}.family`, report);

	if (!isRecord(metrics)) {
		report(`${path}.metrics`, 'must be a Capsize font-metrics object');
		return;
	}
	if (typeof metrics.familyName !== 'string' || metrics.familyName.trim() === '') {
		report(`${path}.metrics.familyName`, 'must be a non-empty string');
	}
	for (const field of REQUIRED_METRICS) {
		if (!isFiniteNumber(metrics[field])) {
			report(`${path}.metrics.${field}`, 'must be a finite number');
		}
	}
	for (const field of OPTIONAL_METRICS) {
		if (metrics[field] !== undefined && !isFiniteNumber(metrics[field])) {
			report(`${path}.metrics.${field}`, 'must be a finite number when set');
		}
	}
	const { ascent, capHeight, descent, lineGap, unitsPerEm } = metrics;
	if (isFiniteNumber(unitsPerEm) && unitsPerEm <= 0) {
		report(`${path}.metrics.unitsPerEm`, 'must be greater than 0');
	}
	if (isFiniteNumber(capHeight) && capHeight <= 0) {
		report(`${path}.metrics.capHeight`, 'must be greater than 0');
	}
	if (isFiniteNumber(ascent) && ascent <= 0) {
		report(`${path}.metrics.ascent`, 'must be greater than 0');
	}
	if (isFiniteNumber(descent) && descent > 0) {
		report(
			`${path}.metrics.descent`,
			'must be 0 or less, as Capsize measures it below the baseline',
		);
	}
	if (isFiniteNumber(lineGap) && lineGap < 0) {
		report(`${path}.metrics.lineGap`, 'must be 0 or greater');
	}
}

function validateFontFamily(
	family: unknown,
	path: string,
	report: (path: string, message: string) => void,
): void {
	if (typeof family !== 'string' || family.trim() === '') {
		report(path, 'must be a non-empty CSS font-family stack');
	} else if (UNSAFE_FAMILY_PATTERN.test(family)) {
		report(path, 'must not contain `;`, `{`, `}`, `<`, `\\`, `/*`, `*/`, or control characters');
	} else if (!isFontFamilyList(family)) {
		report(
			path,
			'must be a comma-separated list of family names and generic families. Quote a name that is not plain words',
		);
	}
}

/**
 * Whether a family is a valid CSS `font-family` list. A browser drops an invalid one whole when it
 * substitutes the token, so the text would fall back to the parent's font instead of the stack.
 */
function isFontFamilyList(family: string): boolean {
	// A quoted name may contain a comma, so each quoted name becomes `''` before the split.
	return family.replaceAll(QUOTED_FAMILY_PATTERN, "''").split(',').every(isFamilyName);
}

/** Whether one entry is a quoted name, a generic family, or plain words. */
function isFamilyName(entry: string): boolean {
	// Only CSS whitespace separates words. `trim` would also strip U+00A0 and U+2003, which CSS reads
	// as part of the entry, so a quoted name followed by one would pass here and fail in the browser.
	const words = entry.split(/[ \t\n\r\f]+/).filter((word) => word !== '');
	const [first] = words;
	if (first === undefined) return false;
	if (words.length === 1 && first === "''") return true;
	if (!words.every((word) => IDENTIFIER_PATTERN.test(word))) return false;
	const keyword = first.toLowerCase();
	if (words.length === 1) return !RESERVED_KEYWORDS.has(keyword);
	return !GENERIC_FAMILIES.has(keyword);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}
