import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import {
	extractValue,
	paperFoundation,
	splitBlocks,
	tactileFoundation,
} from '../test-utils/compiled-theme.js';
import { buildTheme, compileTheme, ThemeGenerationError } from './build-theme.js';
import { parseColor } from './color.js';
import type { ThemeFoundation } from './foundation.js';

describe('buildTheme independent modes', () => {
	it('derives each mode from its own sources rather than inverting light', () => {
		const greenPurpleFoundation: ThemeFoundation = {
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, accent: 'oklch(0.75 0.12 300)' },
			},
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, accent: 'oklch(0.5 0.13 150)' },
			},
			name: 'green-purple',
		};
		const blocks = splitBlocks(buildTheme(greenPurpleFoundation));
		const solidVar = '--luke-color-intent-accent-surface-solid';
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
	it('throws ThemeGenerationError for an accent no on-solid text can sit on', () => {
		const caught = (() => {
			try {
				// A mid-lightness tone whose whole solid window is an on-solid dead zone: neither near-white
				// nor near-black on-solid text clears AA anywhere the search can reach.
				buildTheme({
					...tactileFoundation,
					light: {
						...tactileFoundation.light,
						color: { ...tactileFoundation.light.color, accent: 'oklch(0.62 0.19 27)' },
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

	it('records on each check whether missing its ratio fails the build', () => {
		// Every text pair is a hard gate, and so are the two solved boundaries `border.focus` and
		// `border.control`. The per-intent borders are the only advisory checks — deliberately subtle
		// Radix-style separators below 3:1 (theme-v2 border-contrast policy). The "Theme/Diagnostics"
		// inspector splits its tables on this flag rather than pattern-matching token paths.
		const { diagnostics } = compileTheme(tactileFoundation);
		const advisoryBorders = ['accent', 'danger', 'info', 'success', 'warning'].map(
			(intent) => `color.intent.${intent}.border`,
		);
		const summary = (['light', 'dark'] as const).map((mode) => {
			const checks = diagnostics[mode].contrastChecks;
			const advisory = checks.filter((check) => !check.hard);
			const hard = checks.filter((check) => check.hard);
			return {
				advisoryForegrounds: [...new Set(advisory.map((check) => check.foreground))].sort(),
				// A hard gate that missed its ratio would have thrown before `compileTheme` returned, so a
				// recorded hard check that did not pass would mean the flag disagrees with the compiler.
				everyHardGatePasses: hard.every((check) => check.passes),
				hardBoundaryForegrounds: [
					...new Set(hard.filter((check) => check.required === 3).map((check) => check.foreground)),
				].sort(),
				hardRatios: [...new Set(hard.map((check) => check.required))].sort((a, b) => a - b),
				mode,
				partitionsEveryCheck: hard.length + advisory.length === checks.length,
			};
		});
		expect(summary).toEqual(
			(['light', 'dark'] as const).map((mode) => ({
				advisoryForegrounds: [...advisoryBorders].sort(),
				everyHardGatePasses: true,
				hardBoundaryForegrounds: ['color.border.control', 'color.border.focus'],
				hardRatios: [3, 4.5],
				mode,
				partitionsEveryCheck: true,
			})),
		);
	});
});

// v2 regression goldens: the exact `buildTheme` output for the bundled themes under the wired-in
// scale/elevation/semantic-map pipeline (Stage 6, #238). Asserted byte-identical so any later
// generator change is a reviewed, deliberate diff.
describe('v2 regression goldens', () => {
	const v2Goldens = {
		paper: new URL('./__fixtures__/v2-goldens/paper.v2.css', import.meta.url),
		tactile: new URL('./__fixtures__/v2-goldens/tactile.v2.css', import.meta.url),
	} as const;

	it('keeps every generated token byte-identical to the v2 baseline', async () => {
		const goldenTactile = await readFile(v2Goldens.tactile, 'utf8');
		const goldenPaper = await readFile(v2Goldens.paper, 'utf8');

		expect(buildTheme(tactileFoundation)).toBe(goldenTactile);
		expect(buildTheme(paperFoundation)).toBe(goldenPaper);
	});
});
