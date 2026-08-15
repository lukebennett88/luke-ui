import { describe, expect, it } from 'vite-plus/test';
import { contrastRatio, formatOklch, gamutMapOklch, mixSrgb, parseColor } from './color.js';

describe('parseColor', () => {
	it('round-trips a hex colour through OKLCH formatting', () => {
		const parsed = parseColor('#0160ae');
		const reparsed = parseColor(formatOklch(parsed));
		expect(reparsed.l).toBeCloseTo(parsed.l, 3);
		expect(reparsed.c).toBeCloseTo(parsed.c, 3);
		expect(reparsed.h).toBeCloseTo(parsed.h, 1);
	});

	it('parses shorthand hex and oklch percentages', () => {
		expect(parseColor('#fff').l).toBeCloseTo(1, 5);
		expect(parseColor('oklch(50% 0.1 200)').l).toBeCloseTo(0.5, 5);
		expect(parseColor('oklch(0.5 0.1 200)').h).toBeCloseTo(200, 5);
	});

	it('rejects malformed colours', () => {
		expect(() => parseColor('#ffff')).toThrow(/cannot parse colour/);
		expect(() => parseColor('rgb(0, 0, 0)')).toThrow(/cannot parse colour/);
		expect(() => parseColor('oklch(1.5 0.1 200)')).toThrow(/lightness/);
		expect(() => parseColor('oklch(0.5 0.1 200 / 0.5)')).toThrow(/cannot parse colour/);
	});
});

describe('mixSrgb', () => {
	function srgbToLinear(channel: number): number {
		return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	}

	function contrastFromLuminance(a: number, b: number): number {
		const lighter = Math.max(a, b);
		const darker = Math.min(a, b);
		return (lighter + 0.05) / (darker + 0.05);
	}

	it('mixes white and black at 50% as sRGB gray, matching color-mix(in srgb, ...)', () => {
		const result = mixSrgb(parseColor('#ffffff'), parseColor('#000000'), 0.5);
		const grayLuminance = srgbToLinear(0.5);
		expect(contrastRatio(parseColor('#000000'), result)).toBeCloseTo(
			contrastFromLuminance(0, grayLuminance),
			5,
		);
		expect(contrastRatio(parseColor('#ffffff'), result)).toBeCloseTo(
			contrastFromLuminance(1, grayLuminance),
			5,
		);
	});

	it('mixes white and blue at 50% in sRGB', () => {
		const result = mixSrgb(parseColor('#ffffff'), parseColor('#0000ff'), 0.5);
		const paintedLuminance = 0.2126 * srgbToLinear(0.5) + 0.7152 * srgbToLinear(0.5) + 0.0722;
		expect(contrastRatio(parseColor('#000000'), result)).toBeCloseTo(
			contrastFromLuminance(0, paintedLuminance),
			5,
		);
	});
});

describe('contrastRatio', () => {
	it('measures white on black as 21:1', () => {
		expect(contrastRatio(parseColor('#ffffff'), parseColor('#000000'))).toBeCloseTo(21, 5);
	});

	it('is symmetric', () => {
		const blue = parseColor('#0160ae');
		const white = parseColor('#ffffff');
		expect(contrastRatio(blue, white)).toBeCloseTo(contrastRatio(white, blue), 10);
	});
});

describe('gamutMapOklch', () => {
	it('reduces chroma until the colour fits in sRGB while preserving lightness and hue', () => {
		const outOfGamut = {
			l: 0.6,
			c: 0.4,
			h: 150,
		};
		const mapped = gamutMapOklch(outOfGamut);
		expect(mapped.l).toBe(0.6);
		expect(mapped.h).toBe(150);
		expect(mapped.c).toBeLessThan(0.4);
		expect(mapped.c).toBeGreaterThan(0);
	});

	it('leaves in-gamut colours unchanged and clamps extreme lightness', () => {
		const inGamut = {
			l: 0.5,
			c: 0.05,
			h: 30,
		};
		expect(gamutMapOklch(inGamut)).toEqual(inGamut);
		expect(
			gamutMapOklch({
				l: 1.2,
				c: 0.2,
				h: 30,
			}),
		).toEqual({
			l: 1,
			c: 0,
			h: 30,
		});
	});
});
