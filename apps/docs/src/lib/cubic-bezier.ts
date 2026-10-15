/** The four control values of a CSS `cubic-bezier()` easing: x1, y1, x2, y2. */
export type CubicBezier = readonly [x1: number, y1: number, x2: number, y2: number];

/**
 * Reads a `cubic-bezier()` value into its control points. Returns `null` for any other easing,
 * such as `steps()`, or when an x value falls outside 0 to 1, which CSS rejects.
 */
export function parseCubicBezier(value: string): CubicBezier | null {
	const match = CUBIC_BEZIER_PATTERN.exec(value.trim());
	if (!match) return null;

	const numbers = match.slice(1, 5).map(Number);
	const [x1, y1, x2, y2] = numbers;
	if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return null;
	if (!numbers.every(Number.isFinite)) return null;
	if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null;
	return [x1, y1, x2, y2];
}

const NUMBER_SOURCE = String.raw`\s*(-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)\s*`;
const CUBIC_BEZIER_PATTERN = new RegExp(
	String.raw`^cubic-bezier\(${NUMBER_SOURCE},${NUMBER_SOURCE},${NUMBER_SOURCE},${NUMBER_SOURCE}\)$`,
	'i',
);
