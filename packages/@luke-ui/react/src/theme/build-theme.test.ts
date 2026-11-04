import { describe, expect, it } from 'vite-plus/test';
import {
	extractValue,
	paperFoundation,
	resolvedColor,
	splitBlocks,
	tactileFoundation,
	testTypography,
} from './__fixtures__/theme-css.js';
import { buildTheme, compileTheme } from './build-theme.js';
import { formatOklch, parseColor } from './color.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import { normalizeTheme } from './define-theme.js';
import type { ThemeFoundation } from './foundation.js';
import { FAMILY_RUNG } from './scale.js';

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
			typography: testTypography,
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

describe('compileTheme diagnostics', () => {
	it('returns the emitted CSS plus complete per-mode diagnostics for a valid theme', () => {
		const { css, diagnostics } = compileTheme(tactileFoundation);
		expect(css).toBe(buildTheme(tactileFoundation));
		for (const mode of ['light', 'dark'] as const) {
			const modeDiagnostics = diagnostics[mode];
			expect(modeDiagnostics.mode).toBe(mode);
			// A family diagnostic per role, and every scale role generated.
			expect(Object.keys(modeDiagnostics.families).toSorted()).toEqual(
				[...SEMANTIC_ROLES].toSorted(),
			);
			expect(modeDiagnostics.families.accent.solidAnchor.satisfied).toBe(true);
			// The base surface equals the resolved base anchor.
			expect(modeDiagnostics.surfaces.base).toEqual(tactileFoundation[mode].color.surface.base);
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

describe('compileTheme interaction source', () => {
	const chromaticNeutralFoundation = normalizeTheme({
		color: {
			accent: '#3b82f6',
			neutral: { dark: 'oklch(0.22 0.03 70)', light: 'oklch(0.985 0.03 70)' },
		},
		name: 'chromatic-neutral',
		typography: testTypography,
	});

	it('emits the neutral text.primary and every family’s lightness-stepped solid states', () => {
		const { css, diagnostics } = compileTheme(chromaticNeutralFoundation);
		const blocks = splitBlocks(css);

		for (const mode of ['light', 'dark'] as const) {
			const block = mode === 'light' ? blocks.baseLight : blocks.mediaDark;
			const textPrimary = diagnostics[mode].families.neutral.family[FAMILY_RUNG.textPrimary];
			expect(extractValue(block, '--luke-color-foreground-primary')).toBe(formatOklch(textPrimary));

			for (const role of SEMANTIC_ROLES) {
				const { family } = diagnostics[mode].families[role];
				expect(extractValue(block, `--luke-color-background-${role}-solid-hover`)).toBe(
					formatOklch(family.solidHover),
				);
				expect(extractValue(block, `--luke-color-background-${role}-solid-pressed`)).toBe(
					formatOklch(family.solidPressed),
				);
			}
		}
	});
});

describe('bundled themes meet WCAG 2.2 AA', () => {
	for (const foundation of [tactileFoundation, paperFoundation]) {
		it(`${foundation.name} keeps the light base neutral and emits exactly three surfaces`, () => {
			const { css, diagnostics } = compileTheme(foundation);
			const blocks = splitBlocks(css);
			expect(
				parseColor(extractValue(blocks.baseLight, '--luke-color-background-surface-base')).c,
			).toBe(0);
			for (const mode of ['light', 'dark'] as const) {
				expect(Object.keys(diagnostics[mode].surfaces).toSorted()).toEqual([
					'base',
					'raised',
					'subdued',
				]);
			}
			expect(css).not.toContain('--luke-color-background-surface-field');
		});
	}
});

describe('buildTheme public motion surface', () => {
	// The numbered duration scale in `motion.ts` is private in the same sense as the 12-step colour
	// scale: resolved in TypeScript and never published as a custom property. Only the six treatment
	// leaves reach the stylesheet, so a numbered duration variable here is a leak.
	it('emits six treatment leaves with distinct feedback and enter easing properties', () => {
		for (const foundation of [tactileFoundation, paperFoundation]) {
			const css = buildTheme(foundation);
			const motionVarNames = [...css.matchAll(/--luke-motion-[\w-]+/g)].map(([varName]) => varName);

			expect([...new Set(motionVarNames)].toSorted()).toEqual([
				'--luke-motion-enter-duration',
				'--luke-motion-enter-easing',
				'--luke-motion-exit-duration',
				'--luke-motion-exit-easing',
				'--luke-motion-feedback-duration',
				'--luke-motion-feedback-easing',
			]);
			expect(css).toContain('--luke-motion-feedback-easing:');
			expect(css).toContain('--luke-motion-enter-easing:');
			expect(css).not.toMatch(/--luke-motion-duration-\d/);
			expect(css).not.toMatch(/--luke-motion-easing-/);
		}
	});
});
