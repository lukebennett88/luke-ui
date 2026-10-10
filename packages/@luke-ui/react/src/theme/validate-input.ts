/**
 * Validates theme-authoring inputs before they are merged. Each input in an `extends` chain is
 * checked on its own, against only the fields it sets, so an issue always names the input that
 * contains it. Completeness, which depends on the whole chain, is checked after the merge.
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

/** Checks the fields one input sets. Returns every issue found, or an empty array. */
export function validateThemeInput(
	input: ThemeInput | ExtendingThemeInput,
): Array<ThemeValidationIssue> {
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

/**
 * Checks what only the merged chain can prove: that some input set the required body font. Reports
 * a missing value against the outermost theme.
 */
export function validateMergedInput(
	outermostName: string,
	merged: ThemeInput,
): Array<ThemeValidationIssue> {
	const typography: unknown = merged.typography;
	const body =
		isRecord(typography) && isRecord(typography.fonts) ? typography.fonts.body : undefined;
	if (body !== undefined) return [];
	return [
		{
			message: 'is required. Set it on this theme or on a theme it extends.',
			path: 'typography.fonts.body',
			theme: outermostName,
		},
	];
}

/** The metrics Capsize needs to trim text. Each must be a finite number. */
const REQUIRED_METRICS = ['ascent', 'capHeight', 'descent', 'lineGap', 'unitsPerEm'] as const;

/** Optional numeric metrics. Each must be a finite number when present. */
const OPTIONAL_METRICS = ['xHeight', 'xWidthAvg'] as const;

/**
 * Characters that would let a family break out of its declaration or the stylesheet: a declaration
 * or block delimiter, the start of a tag, or a control character.
 */
// oxlint-disable-next-line eslint/no-control-regex
const UNSAFE_FAMILY_PATTERN = /[;{}<\u0000-\u001F\u007F]/;

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
		report(`${path}.family`, 'must not contain `;`, `{`, `}`, `<`, or control characters');
	} else if (hasUnbalancedQuotes(family)) {
		report(`${path}.family`, 'has an unclosed quote');
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

/** Whether a quoted family name is left open. Each quote closes only the kind that opened it. */
function hasUnbalancedQuotes(family: string): boolean {
	let open: string | null = null;
	for (const character of family) {
		if (character !== "'" && character !== '"') continue;
		if (open === null) open = character;
		else if (open === character) open = null;
	}
	return open !== null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}
