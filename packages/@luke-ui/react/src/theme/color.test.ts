import { describe, expect, it } from 'vite-plus/test';
import { contrastRatio, formatOklch, gamutMapOklch, parseColor } from './color.js';

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
		const outOfGamut = { l: 0.6, c: 0.4, h: 150 };
		const mapped = gamutMapOklch(outOfGamut);
		expect(mapped.l).toBe(0.6);
		expect(mapped.h).toBe(150);
		expect(mapped.c).toBeLessThan(0.4);
		expect(mapped.c).toBeGreaterThan(0);
	});

	it('leaves in-gamut colours unchanged and clamps extreme lightness', () => {
		const inGamut = { l: 0.5, c: 0.05, h: 30 };
		expect(gamutMapOklch(inGamut)).toEqual(inGamut);
		expect(gamutMapOklch({ l: 1.2, c: 0.2, h: 30 })).toEqual({ l: 1, c: 0, h: 30 });
	});
});
