/**
 * Validates an `extends` chain of theme-authoring inputs before it is merged. Each input is checked
 * on its own, against only the fields it sets, so an issue always names the input that contains it.
 * The one requirement that depends on the whole chain, a body font, is checked across all inputs.
 *
 * A chain that passes has a well-formed or absent `typography` on every input and a body font on at
 * least one, which is what `resolveThemeChain` relies on.
 */

import type { ExtendingThemeInput, ThemeInput } from './define-theme.js';
import { fontWeightRoles } from './type-styles.js';

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
 * Thrown by `defineTheme` when a theme input, or an input it extends, is invalid. It reports every
 * issue in the chain at once, one per message line.
 */
export class ThemeValidationError extends Error {
	/** Every issue found, in chain order from the outermost input. */
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

/**
 * Checks every input in a chain, the outermost first, and that some input sets the required body
 * font. Returns every issue found, or an empty array.
 */
export function validateThemeChain(
	inputs: ReadonlyArray<ThemeInput | ExtendingThemeInput>,
): Array<ThemeValidationIssue> {
	const issues = inputs.flatMap(validateThemeInput);
	const [outermost] = inputs;
	if (outermost !== undefined && !inputs.some(setsBodyFont)) {
		issues.push({
			message: 'is required. Set it on this theme or on a theme it extends.',
			path: 'typography.fonts.body',
			theme: String(outermost.name),
		});
	}
	return issues;
}

/** Whether an input sets a body font, whatever its shape. `validateThemeInput` reports the shape. */
function setsBodyFont(input: ThemeInput | ExtendingThemeInput): boolean {
	const typography: unknown = input.typography;
	return isRecord(typography) && isRecord(typography.fonts) && typography.fonts.body !== undefined;
}

/** Checks the fields one input sets. Returns every issue found, or an empty array. */
function validateThemeInput(input: ThemeInput | ExtendingThemeInput): Array<ThemeValidationIssue> {
	const issues: Array<ThemeValidationIssue> = [];
	function report(path: string, message: string) {
		issues.push({ message, path, theme: String(input.name) });
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

/** The metrics Capsize needs to trim text. Each must be a finite number. */
const REQUIRED_METRICS = ['ascent', 'capHeight', 'descent', 'lineGap', 'unitsPerEm'] as const;

/** Optional numeric metrics. Each must be a finite number when present. */
const OPTIONAL_METRICS = ['xHeight', 'xWidthAvg'] as const;

/**
 * Text that would let a family break out of its declaration or the stylesheet: a declaration or
 * block delimiter, the start of a tag, a control character, a backslash, which can escape the
 * closing quote or `;`, or a comment delimiter, which can hide every declaration after it.
 */
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
	if (typeof family !== 'string' || family.trim() === '') {
		report(`${path}.family`, 'must be a non-empty CSS font-family stack');
	} else if (UNSAFE_FAMILY_PATTERN.test(family)) {
		report(
			`${path}.family`,
			'must not contain `;`, `{`, `}`, `<`, `\\`, `/*`, `*/`, or control characters',
		);
	} else if (!isFontFamilyList(family)) {
		report(
			`${path}.family`,
			'must be a comma-separated list of family names and generic families. Quote a name that is not plain words',
		);
	}

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
