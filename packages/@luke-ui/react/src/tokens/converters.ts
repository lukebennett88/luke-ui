import { pxToRem } from '../utils/index.js';
import type {
	ColorTokenValue,
	CubicBezierTokenValue,
	DimensionTokenValue,
	DurationTokenValue,
} from './index.js';

export function dimensionToRemString(value: DimensionTokenValue, base: number = 16): string {
	return value.unit === 'rem' ? `${value.value}rem` : pxToRem(value.value, base);
}

export function dimensionToPxNumber(value: DimensionTokenValue, base: number = 16): number {
	return value.unit === 'px' ? value.value : value.value * base;
}

export function durationToString(value: DurationTokenValue): string {
	return `${value.value}${value.unit}`;
}

export function cubicBezierToString(value: CubicBezierTokenValue): string {
	return `cubic-bezier(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`;
}

const functionLikeColorSpaces = new Set(['hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch']);

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
