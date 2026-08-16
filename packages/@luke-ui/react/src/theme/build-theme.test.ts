import { describe, expect, it } from 'vite-plus/test';
import {
	extractValue,
	paperFoundation,
	resolvedColor,
	splitBlocks,
	tactileFoundation,
} from './__fixtures__/theme-css.js';
import { buildTheme, compileTheme, ThemeGenerationError } from './build-theme.js';
import { contrastRatio, parseColor } from './color.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import type { ThemeFoundation } from './foundation.js';

describe('buildTheme independent modes', () => {
	it('derives each mode from its own sources rather than inverting light', () => {
		const greenPurpleFoundation: ThemeFoundation = {
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, accent: resolvedColor('oklch(0.75 0.12 300)') },
			},
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, accent: resolvedColor('oklch(0.5 0.13 150)') },
			},
			name: 'green-purple',
		};
		const blocks = splitBlocks(buildTheme(greenPurpleFoundation));
		const solidVar = '--luke-color-background-accent-solid-rest';
		const lightSolid = parseColor(extractValue(blocks.baseLight, solidVar));
		const darkSolid = parseColor(extractValue(blocks.mediaDark, solidVar));
		expect(lightSolid.h).toBeCloseTo(150, 0);
		expect(darkSolid.h).toBeCloseTo(300, 0);
		expect(extractValue(blocks.baseLight, solidVar)).not.toBe(
			extractValue(blocks.mediaDark, solidVar),
		);
	});
});

describe('buildTheme generation failures', () => {
	function buildGenerationError(foundation: ThemeFoundation): ThemeGenerationError {
		const caught = (() => {
			try {
				buildTheme(foundation);
				return null;
			} catch (error) {
				return error;
			}
		})();
		if (caught instanceof ThemeGenerationError) return caught;
		throw new Error('expected buildTheme to throw ThemeGenerationError');
	}

	// Every semantic role publishes a solid, so every role must reach an accessible
	// solid/on-solid pair — a status source in an on-solid dead zone is a build failure,
	// not a silently unguaranteed solid. Status sources are used verbatim (only a
	// single-value accent is pre-conditioned into an accessible band), so an authored
	// one reaches the generator exactly as written.
	it('throws ThemeGenerationError naming the role, mode, and achieved ratio for a dead-zone warning', () => {
		const error = buildGenerationError({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, warning: resolvedColor('oklch(0.62 0.19 27)') },
			},
			name: 'bad-warning',
		});

		expect(error.role).toBe('warning');
		expect(error.mode).toBe('light');
		expect(error.bestAttempt.step).toBe(9);
		expect(error.bestAttempt.onSolidRatio).toBeLessThan(4.5);
		expect(error.message).toContain('Cannot generate the light "warning" family');
		expect(error.message).toContain(`${error.bestAttempt.onSolidRatio.toFixed(2)}:1`);
		// Warning is generated fifth, so the four roles before it are reported and the last one is not.
		expect(Object.keys(error.diagnostics.completedFamilies)).toEqual([
			'neutral',
			'accent',
			'info',
			'success',
		]);
	});

	it('throws ThemeGenerationError for an accent no on-solid text can sit on', () => {
		const caught = (() => {
			try {
				// A mid-lightness tone whose whole solid window is an on-solid dead zone: neither near-white
				// nor near-black on-solid text clears AA anywhere the search can reach.
				buildTheme({
					...tactileFoundation,
					light: {
						...tactileFoundation.light,
						color: { ...tactileFoundation.light.color, accent: resolvedColor('oklch(0.62 0.19 27)') },
					},
					name: 'bad-accent',
				});
				return null;
			} catch (error) {
				return error;
			}
		})();
		expect(caught).toBeInstanceOf(ThemeGenerationError);
		const error = caught as ThemeGenerationError;
		expect(error.role).toBe('accent');
		expect(error.mode).toBe('light');
		expect(error.bestAttempt.step).toBe(9);
		expect(error.bestAttempt.onSolidRatio).toBeLessThan(4.5);
		// The partial diagnostics carry the failing role/mode and the families resolved before it.
		expect(error.diagnostics.role).toBe('accent');
		expect(error.diagnostics.mode).toBe('light');
		expect(error.diagnostics.completedFamilies.neutral).toBeDefined();
		expect(error.diagnostics.completedFamilies.accent).toBeUndefined();
	});
});

describe('compileTheme diagnostics', () => {
	it('returns the emitted CSS plus complete per-mode diagnostics for a valid theme', () => {
		const { css, diagnostics } = compileTheme(tactileFoundation);
		expect(css).toBe(buildTheme(tactileFoundation));
		for (const mode of ['light', 'dark'] as const) {
			const modeDiagnostics = diagnostics[mode];
			expect(modeDiagnostics.mode).toBe(mode);
			// A family diagnostic per role, and every scale role generated.
			expect(Object.keys(modeDiagnostics.families).sort()).toEqual(
				['accent', 'danger', 'info', 'neutral', 'success', 'warning'].sort(),
			);
			expect(modeDiagnostics.families.accent.solidAnchor.satisfied).toBe(true);
			// The canvas surface equals the resolved background anchor.
			expect(modeDiagnostics.surfaces.canvas).toBeDefined();
			// The diagnostics data model records every hard-gated text check, not just failures, so
			// tooling (the "Theme/Diagnostics" story) can display the full matrix. Asserting `passes` on
			// each would be dead: `compileTheme` above already throws `ThemeContrastError` before
			// returning if any hard check failed, so every recorded hard check necessarily passed already.
			const hardTextChecks = modeDiagnostics.contrastChecks.filter(
				(check) => check.required === 4.5,
			);
			expect(hardTextChecks.length).toBeGreaterThan(0);
		}
	});
});

describe('bundled themes meet WCAG 2.2 AA', () => {
	for (const foundation of [tactileFoundation, paperFoundation]) {
		// `validateContrast` in contrast-validation.ts already hard-gates text-vs-surface contrast
		// (>=4.5:1, every surface) and border.control-vs-surface contrast (>=3:1, canvas and
		// recessed) for every mode, throwing `ThemeContrastError` on any miss (exercised directly in
		// `contrast-validation.test.ts`). Recomputing those exact ratios from the emitted CSS here can
		// never fail: if either gate had missed, `buildTheme` would already have thrown before this
		// assertion ran. The honest statement of the same property is that building the bundled theme
		// does not throw.
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
			expect(lightRecessed).toEqual({
				l: 1,
				c: 0,
				h: 0,
			});
			expect(darkCanvas.l - darkRecessed.l).toBeGreaterThanOrEqual(0.02);
		});

		it(`${foundation.name} keeps dark accent subtle-hover legible for primary text`, () => {
			// The subtle component surfaces (scale steps 3-5) ramp from the canvas independently of the
			// elevation surfaces and aren't pinned apart from `floating`; what matters is that primary
			// text stays legible on the hovered subtle surface. The neutral subtle hover is
			// excluded here because that exact colour pair is already hard-gated under different names:
			// `color.text.primary` and `color.foreground.neutral.hover` both alias neutral step 12, and
			// `validateContrast` gates the latter against all three neutral subtle states at >=4.5:1.
			// No hard-gated pair covers primary text on the *accent* subtle ramp, so that is the pair
			// worth recomputing.
			const { mediaDark } = splitBlocks(buildTheme(foundation));
			const textPrimary = parseColor(extractValue(mediaDark, '--luke-color-text-primary'));
			const subtleHover = parseColor(
				extractValue(mediaDark, '--luke-color-background-accent-subtle-hover'),
			);
			expect(contrastRatio(textPrimary, subtleHover)).toBeGreaterThanOrEqual(4.5);
		});

		it(`${foundation.name} generates subtle, distinct semantic borders`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			for (const block of [blocks.baseLight, blocks.mediaDark]) {
				const surfaces = ['canvas', 'recessed'].map((surface) => {
					return parseColor(extractValue(block, `--luke-color-surface-${surface}`));
				});
				// The functional borders are excluded: `border.control` is a solved contrast boundary,
				// hard-gated at >=3:1 by `contrast-validation.ts`, and `border.decorative` keeps its own
				// policy. Driven off `SEMANTIC_ROLES` so a role added there is covered here without a
				// second list.
				const borderVarNames = SEMANTIC_ROLES.map((role) => `--luke-color-border-${role}`);

				for (const varName of borderVarNames) {
					const border = parseColor(extractValue(block, varName));
					const minimumContrast = Math.min(
						...surfaces.map((surface) => contrastRatio(border, surface)),
					);
					// The semantic borders alias the scale's step 7 (subtle UI border). They stay visibly
					// distinct from the base surfaces but sit below the 3:1 non-text gate by design: these
					// are soft separators, not solved-contrast boundaries like `border.control`.
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

describe('buildTheme public motion surface', () => {
	// The numbered duration scale in `motion.ts` is private in the same sense as the 12-step colour
	// scale: resolved in TypeScript and never published as a custom property. Only the three
	// role-named durations reach the stylesheet, so a numbered variable here is a leak.
	it('emits the three role-named durations and no numbered duration step', () => {
		for (const foundation of [tactileFoundation, paperFoundation]) {
			const css = buildTheme(foundation);
			const durationVarNames = [...css.matchAll(/--luke-motion-duration-[\w-]+/g)].map(
				([varName]) => varName,
			);

			expect([...new Set(durationVarNames)]).toEqual([
				'--luke-motion-duration-feedback',
				'--luke-motion-duration-enter',
				'--luke-motion-duration-exit',
			]);
			expect(css).not.toMatch(/--luke-motion-duration-\d/);
		}
	});
});
