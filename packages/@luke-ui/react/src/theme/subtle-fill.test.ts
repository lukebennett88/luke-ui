import { describe, expect, it } from 'vite-plus/test';
import {
	extractValue,
	paperFoundation,
	splitBlocks,
	tactileFoundation,
} from './__fixtures__/theme-css.js';
import { compileTheme } from './build-theme.js';
import type { Oklch } from './color.js';
import {
	compositeOver,
	oklabDistance,
	oklchToSrgb,
	parseColor,
	parseColorWithAlpha,
} from './color.js';
import { flattenThemeContract } from './contract.js';
import {
	SEMANTIC_ROLES,
	SUBTLE_FILL_MAX_RESIDUAL,
	SUBTLE_FILL_MIN_STEP,
	SUBTLE_FILL_STEP_FLOOR,
} from './contrast-policy.js';
import { SURFACE_ROLES } from './foundation.js';
import type { SurfaceRole } from './foundation.js';
import { generateSubtleFill, SUBTLE_FILL_STATES } from './subtle-fill.js';
import { generateSurfaces } from './surfaces.js';

const darkSurfaces = generateSurfaces({
	mode: 'dark',
	surface: { base: parseColor('oklch(0.22 0.01 250)') },
});
const lightSurfaces = generateSurfaces({
	mode: 'light',
	surface: { base: parseColor('oklch(0.985 0.006 90)') },
});

/** Opaque targets that one known tint paints over `base` at the given alphas. */
function targetsFrom(base: Oklch, tint: Oklch, alphas: [number, number, number]) {
	return {
		rest: compositeOver(base, tint, alphas[0]),
		hover: compositeOver(base, tint, alphas[1]),
		pressed: compositeOver(base, tint, alphas[2]),
	};
}

describe('generateSubtleFill', () => {
	it('reproduces targets that a single translucent tint can paint', () => {
		const tint = parseColor('oklch(1 0 0)');
		const targets = targetsFrom(darkSurfaces.base, tint, [0.05, 0.09, 0.13]);
		const fill = generateSubtleFill({ surfaces: darkSurfaces, targets });
		for (const state of SUBTLE_FILL_STATES) expect(fill.residual[state]).toBeLessThan(0.001);
		expect(fill.raised).toEqual([]);
	});

	it('extends the tint to the edge of the sRGB gamut so the alpha stays small', () => {
		const targets = targetsFrom(lightSurfaces.base, parseColor('oklch(0.5 0 0)'), [0.1, 0.2, 0.3]);
		const fill = generateSubtleFill({ surfaces: lightSurfaces, targets });
		const channels = oklchToSrgb(fill.tint);
		expect(Math.min(...channels)).toBeLessThan(0.005);
		expect(fill.alpha.pressed).toBeLessThan(0.3);
	});

	for (const [mode, surfaces] of [
		['light', lightSurfaces],
		['dark', darkSurfaces],
	] as const) {
		it(`raises states that would sit too close together on any ${mode} surface`, () => {
			const tint = parseColor(mode === 'light' ? 'oklch(0 0 0)' : 'oklch(1 0 0)');
			const targets = targetsFrom(surfaces.base, tint, [0.004, 0.006, 0.008]);
			const fill = generateSubtleFill({ surfaces, targets });
			expect(fill.raised).toEqual(['rest', 'hover', 'pressed']);
			for (const surface of SURFACE_ROLES) {
				for (const state of SUBTLE_FILL_STATES) {
					expect(fill.layers[surface][state].step).toBeGreaterThanOrEqual(SUBTLE_FILL_MIN_STEP);
				}
			}
		});
	}

	it('reports steps below the calibrated floor without failing', () => {
		const tint = parseColor('oklch(1 0 0)');
		const targets = targetsFrom(darkSurfaces.base, tint, [0.012, 0.024, 0.036]);
		const fill = generateSubtleFill({ surfaces: darkSurfaces, targets });
		expect(fill.weakSteps.length).toBeGreaterThan(0);
		for (const weak of fill.weakSteps) {
			expect(weak.step).toBeLessThan(SUBTLE_FILL_STEP_FLOOR);
			expect(fill.layers[weak.surface][weak.state].step).toBe(weak.step);
		}
	});
});

describe('subtle fills in the fixture themes', () => {
	// The fixtures share their colour inputs with the published Paper and Tactile themes, and the
	// flat fixture extends Tactile without changing colour, so these cover every shipped palette.
	for (const foundation of [paperFoundation, tactileFoundation]) {
		const { css, diagnostics } = compileTheme(foundation);
		const blocks = splitBlocks(css);
		const variables = new Map<string, string>(flattenThemeContract());
		for (const mode of ['light', 'dark'] as const) {
			const block = mode === 'light' ? blocks.baseLight : blocks.mediaDark;
			const emitted = (path: string) => extractValue(block, variables.get(path)!);
			const surfaces = Object.fromEntries(
				SURFACE_ROLES.map((role) => [role, parseColor(emitted(`color.surface.${role}`))]),
			) as Record<SurfaceRole, Oklch>;

			for (const role of SEMANTIC_ROLES) {
				const fill = diagnostics[mode].subtleFills[role];
				const states = SUBTLE_FILL_STATES.map((state) => {
					return parseColorWithAlpha(emitted(`color.background.${role}.subtle.${state}`));
				});

				it(`emits one translucent ${role} tint at rising alpha (${foundation.name} ${mode})`, () => {
					for (const { alpha, color } of states) {
						expect(alpha).toBeGreaterThan(0);
						expect(alpha).toBeLessThan(1);
						expect(color).toEqual(states[0]!.color);
					}
					expect(states[0]!.alpha).toBeLessThan(states[1]!.alpha);
					expect(states[1]!.alpha).toBeLessThan(states[2]!.alpha);
				});

				it(`reproduces the opaque ${role} fills over base (${foundation.name} ${mode})`, () => {
					for (const [index, state] of SUBTLE_FILL_STATES.entries()) {
						const { alpha, color } = states[index]!;
						const painted = compositeOver(surfaces.base, color, alpha);
						const target = fill.targets[state];
						expect(oklabDistance(painted, target)).toBeLessThanOrEqual(SUBTLE_FILL_MAX_RESIDUAL);
						// Chroma absorbs the residual. Lightness, which text contrast follows, stays put.
						expect(Math.abs(painted.l - target.l)).toBeLessThan(0.001);
					}
				});

				it(`keeps ${role} states ordered and above the floor on every surface (${foundation.name} ${mode})`, () => {
					for (const surface of SURFACE_ROLES) {
						let previous = surfaces[surface];
						let previousDistance = 0;
						for (const { alpha, color } of states) {
							const painted = compositeOver(surfaces[surface], color, alpha);
							const distance = oklabDistance(painted, surfaces[surface]);
							expect(distance).toBeGreaterThan(previousDistance);
							expect(oklabDistance(painted, previous)).toBeGreaterThanOrEqual(
								SUBTLE_FILL_STEP_FLOOR,
							);
							previous = painted;
							previousDistance = distance;
						}
					}
					expect(fill.weakSteps).toEqual([]);
				});
			}
		}
	}
});
