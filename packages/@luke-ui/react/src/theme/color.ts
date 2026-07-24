/**
 * Colour math for the theme compiler. Self-contained OKLCH/sRGB conversions, CSS-style sRGB gamut
 * mapping, and WCAG 2.2 contrast so `buildTheme` stays dependency-free and Node-compatible.
 */

/** A colour in the OKLCH colour space. */
export interface Oklch {
	/** Perceptual lightness, 0 to 1. */
	l: number;
	/** Chroma, 0 or greater. */
	c: number;
	/** Hue angle in degrees, normalised to 0 to 360. */
	h: number;
}

/** Parses a `#rgb`, `#rrggbb`, or `oklch(<l> <c> <h>)` colour string into OKLCH. */
export function parseColor(input: string): Oklch {
	const trimmed = input.trim();
	if (HEX_PATTERN.test(trimmed)) {
		const [r, g, b] = parseHex(trimmed);
		return linearSrgbToOklch([srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)]);
	}
	const match = OKLCH_PATTERN.exec(trimmed);
	if (match !== null) {
		const [, lightnessText, percentSign, chromaText, hueText] = match;
		const rawLightness = Number(lightnessText);
		const l = percentSign === '%' ? rawLightness / 100 : rawLightness;
		const c = Number(chromaText);
		const h = Number(hueText);
		if (l < 0 || l > 1) {
			throw new Error(`cannot parse colour "${input}"; oklch lightness must be 0-1 or 0%-100%`);
		}
		return { l, c, h: normalizeHue(h) };
	}
	throw new Error(`cannot parse colour "${input}"; expected #rgb, #rrggbb, or oklch(<l> <c> <h>)`);
}

/**
 * WCAG 2.2 contrast ratio between two colours, computed on their sRGB-gamut-mapped equivalents.
 */
export function contrastRatio(a: Oklch, b: Oklch): number {
	const luminanceA = relativeLuminance(a);
	const luminanceB = relativeLuminance(b);
	const lighter = Math.max(luminanceA, luminanceB);
	const darker = Math.min(luminanceA, luminanceB);
	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Maps a colour into the sRGB gamut the way CSS does: clamp lightness, then binary-search chroma
 * down while preserving lightness and hue.
 */
export function gamutMapOklch(color: Oklch): Oklch {
	const h = normalizeHue(color.h);
	if (color.l <= 0) return { l: 0, c: 0, h };
	if (color.l >= 1) return { l: 1, c: 0, h };
	const candidate = { l: color.l, c: Math.max(color.c, 0), h };
	if (isInSrgbGamut(candidate)) return candidate;
	let inGamutChroma = 0;
	let outOfGamutChroma = candidate.c;
	for (let iteration = 0; iteration < 32; iteration++) {
		const mid = (inGamutChroma + outOfGamutChroma) / 2;
		if (isInSrgbGamut({ l: color.l, c: mid, h })) {
			inGamutChroma = mid;
		} else {
			outOfGamutChroma = mid;
		}
	}
	return { l: color.l, c: inGamutChroma, h };
}

/** Formats an OKLCH colour as a CSS `oklch()` value, with an optional alpha channel. */
export function formatOklch(color: Oklch, alpha?: number): string {
	const l = trimNumber(color.l, 4);
	const c = trimNumber(color.c, 4);
	const h = trimNumber(normalizeHue(color.h), 2);
	if (alpha === undefined || alpha >= 1) return `oklch(${l} ${c} ${h})`;
	return `oklch(${l} ${c} ${h} / ${trimNumber(alpha, 3)})`;
}

/** WCAG 2.2 relative luminance of the colour's sRGB-gamut-mapped equivalent. */
function relativeLuminance(color: Oklch): number {
	const [unclampedR, unclampedG, unclampedB] = oklchToLinearSrgb(gamutMapOklch(color));
	const r = clampUnit(unclampedR);
	const g = clampUnit(unclampedG);
	const b = clampUnit(unclampedB);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

type SrgbTriple = [number, number, number];

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const OKLCH_PATTERN = /^oklch\(\s*(\d*\.?\d+)(%?)\s+(\d*\.?\d+)\s+(\d*\.?\d+)(?:deg)?\s*\)$/i;
const GAMUT_EPSILON = 0.000001;

function parseHex(hex: string): SrgbTriple {
	const digits = hex.slice(1);
	const expanded = digits.length === 3 ? digits.replace(/./g, (digit) => digit + digit) : digits;
	return [
		Number.parseInt(expanded.slice(0, 2), 16) / 255,
		Number.parseInt(expanded.slice(2, 4), 16) / 255,
		Number.parseInt(expanded.slice(4, 6), 16) / 255,
	];
}

function normalizeHue(hue: number): number {
	if (!Number.isFinite(hue)) return 0;
	const wrapped = hue % 360;
	return wrapped < 0 ? wrapped + 360 : wrapped;
}

function clampUnit(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function trimNumber(value: number, digits: number): string {
	return Number(value.toFixed(digits)).toString();
}

function srgbToLinear(channel: number): number {
	return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function isInSrgbGamut(color: Oklch): boolean {
	return oklchToLinearSrgb(color).every(
		(channel) => channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON,
	);
}

function oklchToLinearSrgb(color: Oklch): SrgbTriple {
	const hueRadians = (normalizeHue(color.h) * Math.PI) / 180;
	const labA = color.c * Math.cos(hueRadians);
	const labB = color.c * Math.sin(hueRadians);
	const lCubeRoot = color.l + 0.3963377774 * labA + 0.2158037573 * labB;
	const mCubeRoot = color.l - 0.1055613458 * labA - 0.0638541728 * labB;
	const sCubeRoot = color.l - 0.0894841775 * labA - 1.291485548 * labB;
	const lCone = lCubeRoot ** 3;
	const mCone = mCubeRoot ** 3;
	const sCone = sCubeRoot ** 3;
	return [
		4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
		-1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
		-0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
	];
}

function linearSrgbToOklch(rgb: SrgbTriple): Oklch {
	const [r, g, b] = rgb;
	const lCone = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const mCone = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const sCone = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
	const lCubeRoot = Math.cbrt(lCone);
	const mCubeRoot = Math.cbrt(mCone);
	const sCubeRoot = Math.cbrt(sCone);
	const l = 0.2104542553 * lCubeRoot + 0.793617785 * mCubeRoot - 0.0040720468 * sCubeRoot;
	const labA = 1.9779984951 * lCubeRoot - 2.428592205 * mCubeRoot + 0.4505937099 * sCubeRoot;
	const labB = 0.0259040371 * lCubeRoot + 0.7827717662 * mCubeRoot - 0.808675766 * sCubeRoot;
	const c = Math.hypot(labA, labB);
	const h = c < 0.000001 ? 0 : normalizeHue((Math.atan2(labB, labA) * 180) / Math.PI);
	return { l, c, h };
}
