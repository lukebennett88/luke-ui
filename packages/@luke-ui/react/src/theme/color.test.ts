import { describe, expect, it } from 'vite-plus/test';
import {
	compositeEncodedSrgb,
	contrastRatio,
	formatOklch,
	gamutMapOklch,
	mixOklab,
	parseColor,
} from './color.js';
import { oklabDeltaE } from './scale.js';

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

describe('compositeEncodedSrgb', () => {
	it('composites white over black in encoded sRGB, not linear light', () => {
		const black = parseColor('#000000');
		const white = parseColor('#ffffff');
		const encoded = compositeEncodedSrgb(white, black, 0.1);
		// Linear-light source-over of white over black at 0.1 is channel 0.1 in linear space, which
		// encodes near #595959 (OKLab L ≈ 0.46). Encoded sRGB source-over stays near L 0.22.
		const linearLightComposite = parseColor('#595959');
		expect(encoded.l).toBeLessThan(0.25);
		expect(oklabDeltaE(encoded, black)).toBeLessThan(
			oklabDeltaE(linearLightComposite, black) * 0.6,
		);
	});

	it('returns the destination at alpha 0 and the source at alpha 1', () => {
		const destination = parseColor('#0160ae');
		const source = parseColor('#ffffff');
		expect(oklabDeltaE(compositeEncodedSrgb(source, destination, 0), destination)).toBeCloseTo(
			0,
			5,
		);
		expect(oklabDeltaE(compositeEncodedSrgb(source, destination, 1), source)).toBeCloseTo(0, 5);
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
