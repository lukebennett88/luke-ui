import { describe, expect, it } from 'vite-plus/test';
import {
	compositeSourceOver,
	contrastRatio,
	formatOklch,
	gamutMapOklch,
	mixOklab,
	parseColor,
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

describe('compositeSourceOver', () => {
	it('returns the backdrop unchanged at amount 0', () => {
		const backdrop = parseColor('#0160ae');
		const result = compositeSourceOver(parseColor('#ffffff'), backdrop, 0);
		expect(result.l).toBeCloseTo(backdrop.l, 5);
		expect(result.c).toBeCloseTo(backdrop.c, 5);
		expect(result.h).toBeCloseTo(backdrop.h, 1);
	});

	it('returns the source unchanged at amount 1', () => {
		const source = parseColor('#0160ae');
		const result = compositeSourceOver(source, parseColor('#ffffff'), 1);
		expect(result.l).toBeCloseTo(source.l, 5);
		expect(result.c).toBeCloseTo(source.c, 5);
		expect(result.h).toBeCloseTo(source.h, 1);
	});

	it('differs from an OKLab mix at the same amount, because it composites rather than interpolates', () => {
		// This is the compositing-model distinction the theme's ghost/unselected interaction colours
		// depend on: `color-mix(in oklab, source N%, transparent)` painted over a backdrop is real
		// source-over alpha compositing, not an OKLab interpolation between two opaque colours.
		const black = parseColor('#000000');
		const white = parseColor('#ffffff');
		const composited = compositeSourceOver(black, white, 0.1);
		const mixed = mixOklab(white, black, 0.1);
		expect(Math.abs(composited.l - mixed.l)).toBeGreaterThan(0.001);
	});

	it('matches real browser source-over compositing, blended on gamma-encoded channels', () => {
		// Ground truth measured with Canvas 2D `source-over` — the same simple-alpha-compositing
		// model CSS uses to paint a translucent `background-color` — reading back the pixel via
		// `getImageData`: a near-white overlay at 10% alpha painted over `rgb(32,32,32)` composites
		// to `rgb(54,54,54)`. That matches a naive blend done directly on 0-255 gamma-encoded
		// channels (`255 * 0.1 + 32 * 0.9 = 54.3`), not linear-light blending (which predicts a much
		// lighter ≈94-95): browsers do not linearise before compositing CSS colours.
		const backdrop = parseColor('#202020');
		const source = parseColor('#ffffff');
		const result = compositeSourceOver(source, backdrop, 0.1);
		// The measured ground truth is an 8-bit byte (54), while this function's exact floating-point
		// blend lands at 54.3/255 before any rounding, so the match is to within a fraction of a byte
		// rather than bit-for-bit.
		const expected = parseColor('#363636');
		expect(result.l).toBeCloseTo(expected.l, 2);
		expect(result.c).toBeCloseTo(expected.c, 2);
	});

	it('matches direct gamma-space alpha blending for a partial amount', () => {
		// #808080 gamma-encoded is 128/255. Compositing black at 50% over white directly on
		// gamma-encoded channels lands at the naive sRGB average, `#808080` — distinctly different
		// from linear-light blending (linear 0.5 re-encodes to roughly `#bcbcbc`).
		const black = parseColor('#000000');
		const white = parseColor('#ffffff');
		const result = compositeSourceOver(black, white, 0.5);
		const expected = parseColor('#808080');
		expect(result.l).toBeCloseTo(expected.l, 2);
		expect(result.c).toBeCloseTo(0, 2);
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
