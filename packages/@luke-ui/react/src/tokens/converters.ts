import { pxToRem } from '../utils/index.js';
import type {
	ColorTokenValue,
	CubicBezierTokenValue,
	DimensionTokenValue,
	DurationTokenValue,
} from './index.js';

/** Converts a `DimensionTokenValue` to a rem string. */
export function dimensionToRemString(value: DimensionTokenValue, base: number = 16): string {
	return value.unit === 'rem' ? `${value.value}rem` : pxToRem(value.value, base);
}

/** Converts a `DurationTokenValue` to a CSS time string. */
export function durationToString(value: DurationTokenValue): string {
	return `${value.value}${value.unit}`;
}

/** Converts a `CubicBezierTokenValue` to a `cubic-bezier(...)` CSS string. */
export function cubicBezierToString(value: CubicBezierTokenValue): string {
	return `cubic-bezier(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`;
}

const functionLikeColorSpaces = new Set(['hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch']);

/** Converts a `ColorTokenValue` to a CSS color string. */
export function colorToCssString(value: ColorTokenValue): string {
	if (value.components.length === 0) {
		throw new Error(`Color token "${value.colorSpace}" has no components`);
	}

	const components = value.components.map((component) => formatNumber(component));
	const alphaSuffix =
		value.alpha === undefined || value.alpha === 1 ? '' : ` / ${formatNumber(value.alpha)}`;

	if (functionLikeColorSpaces.has(value.colorSpace)) {
		return `${value.colorSpace}(${components.join(' ')}${alphaSuffix})`;
	}

	return `color(${value.colorSpace} ${components.join(' ')}${alphaSuffix})`;
}

function formatNumber(value: number): string {
	if (!Number.isFinite(value)) {
		throw new Error(`Invalid numeric color component: ${value}`);
	}

	const normalized = Object.is(value, -0) ? 0 : value;
	return `${normalized}`;
}

export function isColorTokenValue(v: unknown): v is ColorTokenValue {
	return (
		typeof v === 'object' &&
		v !== null &&
		'colorSpace' in v &&
		typeof v.colorSpace === 'string' &&
		'components' in v &&
		Array.isArray(v.components)
	);
}

function isCubicBezierTokenValue(v: unknown): v is CubicBezierTokenValue {
	return Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number');
}

function isDimensionTokenValue(v: unknown): v is DimensionTokenValue {
	return (
		typeof v === 'object' &&
		v !== null &&
		'unit' in v &&
		(v.unit === 'px' || v.unit === 'rem') &&
		'value' in v &&
		typeof v.value === 'number'
	);
}

function isDurationTokenValue(v: unknown): v is DurationTokenValue {
	return (
		typeof v === 'object' &&
		v !== null &&
		'unit' in v &&
		(v.unit === 'ms' || v.unit === 's') &&
		'value' in v &&
		typeof v.value === 'number'
	);
}

/**
 * Convert a token value to its CSS string form, dispatching on the token's
 * `$type`. Values whose shape does not match the declared type fall back to
 * `String(value)` so a malformed token never crashes the build.
 */
export function toCssValue(type: string, value: unknown): string {
	switch (type) {
		case 'color':
			if (isColorTokenValue(value)) return colorToCssString(value);
			break;
		case 'cubicBezier':
			if (isCubicBezierTokenValue(value)) return cubicBezierToString(value);
			break;
		case 'dimension':
			if (isDimensionTokenValue(value)) return dimensionToRemString(value);
			break;
		case 'duration':
			if (isDurationTokenValue(value)) return durationToString(value);
			break;
	}
	return String(value);
}
