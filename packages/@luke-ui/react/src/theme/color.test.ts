import { describe, expect, it } from 'vite-plus/test';
import {
	compositeOver,
	contrastRatio,
	formatOklch,
	gamutMapOklch,
	mixOklab,
	oklabDistance,
	oklchToSrgb,
	parseColor,
	parseColorWithAlpha,
} from './color.js';

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

describe('parseColorWithAlpha', () => {
	it('reads the alpha channel of an emitted translucent colour', () => {
		const { alpha, color } = parseColorWithAlpha('oklch(0.5 0.1 200 / 0.045)');
		expect(alpha).toBe(0.045);
		expect(color).toEqual(parseColor('oklch(0.5 0.1 200)'));
	});

	it('round-trips formatOklch output with alpha', () => {
		const color = parseColor('oklch(0.62 0.12 140)');
		expect(parseColorWithAlpha(formatOklch(color, 0.08))).toEqual({ alpha: 0.08, color });
	});

	it('treats an opaque colour as alpha 1', () => {
		expect(parseColorWithAlpha('#ffffff').alpha).toBe(1);
	});

	it('rejects an alpha above 1', () => {
		expect(() => parseColorWithAlpha('oklch(0.5 0.1 200 / 1.5)')).toThrow(/alpha/);
	});
});

describe('compositeOver', () => {
	it('blends gamma-encoded sRGB channels, as browsers paint', () => {
		const grey = compositeOver(parseColor('#000000'), parseColor('#ffffff'), 0.5);
		for (const channel of oklchToSrgb(grey)) expect(channel).toBeCloseTo(0.5, 5);
	});

	it('returns the background at alpha 0 and the tint at alpha 1', () => {
		const background = parseColor('#0160ae');
		const tint = parseColor('#e5484d');
		expect(oklabDistance(compositeOver(background, tint, 0), background)).toBeLessThan(1e-6);
		expect(oklabDistance(compositeOver(background, tint, 1), tint)).toBeLessThan(1e-6);
	});
});

describe('oklabDistance', () => {
	it('measures the lightness difference between two greys', () => {
		expect(oklabDistance(parseColor('oklch(0.2 0 0)'), parseColor('oklch(0.5 0 0)'))).toBeCloseTo(
			0.3,
			10,
		);
	});
});

describe('mixOklab', () => {
	it('mixes equal parts of two colours toward the midpoint lightness', () => {
		const white = parseColor('#ffffff');
		const black = parseColor('#000000');
		const result = mixOklab(white, black, 0.5);
		expect(result.l).toBeCloseTo((white.l + black.l) / 2, 5);
		expect(result.c).toBeCloseTo(0, 5);
	});

	it('returns the second colour at amount 1', () => {
		const from = parseColor('#ffffff');
		const to = parseColor('#0160ae');
		const result = mixOklab(from, to, 1);
		expect(result.l).toBeCloseTo(to.l, 5);
		expect(result.c).toBeCloseTo(to.c, 5);
		expect(result.h).toBeCloseTo(to.h, 1);
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
