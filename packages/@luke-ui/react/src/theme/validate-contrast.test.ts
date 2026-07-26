import { describe, expect, it } from 'vite-plus/test';
import {
	extractValue,
	paperFoundation,
	splitBlocks,
	tactileFoundation,
} from '../test-utils/compiled-theme.js';
import { buildTheme, ThemeContrastError } from './build-theme.js';
import { contrastRatio, parseColor } from './color.js';
import type { ThemeFoundation } from './foundation.js';

describe('buildTheme contrast failures', () => {
	function buildFailures(foundation: ThemeFoundation): ThemeContrastError {
		const caught = (() => {
			try {
				buildTheme(foundation);
				return null;
			} catch (error) {
				return error;
			}
		})();
		if (caught instanceof ThemeContrastError) return caught;
		throw new Error('expected buildTheme to throw ThemeContrastError');
	}

	it('rejects a low-contrast focus colour, naming mode, pair, and required ratio', () => {
		const error = buildFailures({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: '#c5d9ff' },
			},
			name: 'bad-focus',
		});
		const failure = error.failures.find((candidate) => {
			return (
				candidate.foreground === 'color.border.focus' &&
				candidate.background === 'color.surface.canvas'
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.mode).toBe('light');
		expect(failure?.required).toBe(3);
		expect(failure?.ratio).toBeLessThan(3);
		expect(error.message).toMatch(
			/light: color\.border\.focus on color\.surface\.canvas — \d+\.\d\d:1 < 3:1/,
		);
	});

	it('rejects a pathological dark-mode canvas the fixed text anchors cannot clear', () => {
		// v2 pins text lightness (neutral steps 11/12) per mode, so an unworkable neutral character no
		// longer produces low-contrast text; the honest failure mode is instead a canvas whose lightness
		// leaves the fixed text anchors below AA. A near-white dark canvas does exactly that.
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, background: 'oklch(0.9 0 0)' },
			},
			name: 'bad-dark-canvas',
		});
		const failure = error.failures.find((candidate) => {
			return (
				candidate.mode === 'dark' &&
				candidate.foreground === 'color.text.primary' &&
				candidate.background.startsWith('color.surface.')
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.required).toBe(4.5);
		expect(error.message).toContain('dark: color.text.primary on color.surface.canvas');
	});

	it('aggregates every failing pair into one error', () => {
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, background: 'oklch(0.9 0 0)' },
			},
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: '#c5d9ff' },
			},
			name: 'bad-both',
		});
		const foregrounds = new Set(error.failures.map((failure) => failure.foreground));
		// A low-contrast light focus ring and a pathological dark canvas fail different pairs across both
		// modes; the error collects them all.
		expect(foregrounds.has('color.border.focus')).toBe(true);
		expect(foregrounds.has('color.text.primary')).toBe(true);
		expect(error.failures.length).toBeGreaterThan(2);
		expect(error.message.split('\n').length).toBe(error.failures.length + 1);
	});
});

describe('bundled themes meet WCAG 2.2 AA', () => {
	for (const foundation of [tactileFoundation, paperFoundation]) {
		// `validateContrast` already hard-gates text-vs-surface contrast (>=4.5:1, every surface) and
		// border.control-vs-surface contrast (>=3:1, canvas and recessed) for every mode, throwing
		// `ThemeContrastError` on any miss (exercised directly in "buildTheme contrast failures" above).
		// Recomputing those exact ratios from the emitted CSS here can never fail: if either gate had
		// missed, `buildTheme` would already have thrown before this assertion ran. The honest statement
		// of the same property is that building the bundled theme does not throw.
		it(`${foundation.name} compiles without a WCAG hard-gate failure`, () => {
			expect(() => buildTheme(foundation)).not.toThrow();
		});

		it(`${foundation.name} keeps light canvas neutral, recessed surfaces white, and dark wells distinct`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			const lightCanvas = parseColor(extractValue(blocks.baseLight, '--luke-color-surface-canvas'));
			const lightRecessed = parseColor(
				extractValue(blocks.baseLight, '--luke-color-surface-recessed'),
			);
			const darkCanvas = parseColor(extractValue(blocks.mediaDark, '--luke-color-surface-canvas'));
			const darkRecessed = parseColor(
				extractValue(blocks.mediaDark, '--luke-color-surface-recessed'),
			);

			expect(lightCanvas.c).toBe(0);
			expect(lightRecessed).toEqual({ l: 1, c: 0, h: 0 });
			expect(darkCanvas.l - darkRecessed.l).toBeGreaterThanOrEqual(0.02);
		});

		it(`${foundation.name} keeps dark accent subtle-hover legible for primary text`, () => {
			// The subtle component surfaces (scale steps 3-5) ramp from the canvas independently of the
			// elevation surfaces, so v2 no longer pins them apart from `floating`; what still matters is
			// that primary text stays legible on the hovered subtle surface. Neutral subtleHover is
			// excluded here: `validateContrast` already hard-gates `color.text.primary` against every
			// neutral surface state (including subtleHover) at >=4.5:1, so recomputing that exact pair
			// would be dead — accent subtleHover is not one of the hard-gated pairs, so it is the one
			// worth recomputing.
			const { mediaDark } = splitBlocks(buildTheme(foundation));
			const textPrimary = parseColor(extractValue(mediaDark, '--luke-color-text-primary'));
			const subtleHover = parseColor(
				extractValue(mediaDark, '--luke-color-intent-accent-surface-subtle-hover'),
			);
			expect(contrastRatio(textPrimary, subtleHover)).toBeGreaterThanOrEqual(4.5);
		});

		it(`${foundation.name} generates subtle, distinct intent borders`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			for (const block of [blocks.baseLight, blocks.mediaDark]) {
				const surfaces = ['canvas', 'recessed'].map((surface) => {
					return parseColor(extractValue(block, `--luke-color-surface-${surface}`));
				});
				// border.control is excluded here: it is now a solved contrast boundary, hard-gated at
				// >=3:1 by `validateContrast`, not one of these subtle Radix-style separators.
				const borderVarNames = ['accent', 'info', 'success', 'warning', 'danger'].map(
					(intent) => `--luke-color-intent-${intent}-border`,
				);

				for (const varName of borderVarNames) {
					const border = parseColor(extractValue(block, varName));
					const minimumContrast = Math.min(
						...surfaces.map((surface) => contrastRatio(border, surface)),
					);
					// v2 intent borders alias the scale's step 7 (subtle UI border). They stay visibly
					// distinct from the base surfaces but sit below the 3:1 non-text gate the old bespoke
					// solver targeted — a deliberate move to the reference scale's softer separators.
					expect(minimumContrast).toBeGreaterThan(1.2);
					expect(minimumContrast).toBeLessThan(3);
				}
			}
		});
	}
});

// The loading-skeleton contrast gate lives in `loading-skeleton.browser.test.ts` ("keeps the
// pulse's dimmest frame perceptible against every bundled theme's canvas"), which samples the real
// animated pulse and requires >=1.4:1 at both its brightest and dimmest frame. That subsumes and is
// stricter than a static "skeleton !== canvas and contrastRatio > 1" check would ever be — the
// latter is a tautology once the two colours are already known to differ, so it added no coverage.
