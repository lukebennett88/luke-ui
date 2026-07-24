import { describe, expect, it } from 'vite-plus/test';
import {
	chromaEnvelope,
	HUE_STRESS_CORPUS,
	lightnessEnvelope,
	RADIX_DARK_OKLCH,
	RADIX_LIGHT_OKLCH,
	UNSATISFIABLE_ON_SOLID,
} from './__fixtures__/radix-scales.js';
import type { Oklch } from './color.js';
import { contrastRatio, parseColor } from './color.js';
import type { FamilyRole } from './scale.js';
import {
	FAMILY_REQUIREMENTS,
	generateFamily,
	generateFamilyWithDiagnostics,
	MIN_STATE_DELTA,
	oklabDeltaE,
	ScaleGenerationError,
} from './scale.js';

type ColorMode = 'light' | 'dark';

// Representative canvases: a near-white light canvas and a near-black dark canvas, faintly cool.
const BACKGROUND: Record<ColorMode, Oklch> = {
	dark: parseColor('oklch(0.18 0.004 250)'),
	light: parseColor('oklch(0.99 0.003 250)'),
};

const TEXT_RATIO = 4.5;
const NEEDS_ON_SOLID_ROLES: ReadonlyArray<FamilyRole> = ['neutral', 'accent', 'danger'];
const FEEDBACK_ROLES: ReadonlyArray<FamilyRole> = ['info', 'success', 'warning'];
const MODES: ReadonlyArray<ColorMode> = ['light', 'dark'];

function family(source: string, mode: ColorMode, role: FamilyRole) {
	return generateFamily({ background: BACKGROUND[mode], mode, role, source: parseColor(source) });
}

describe('FAMILY_REQUIREMENTS', () => {
	it('requires on-solid only for the action roles the contract renders solids for', () => {
		expect(FAMILY_REQUIREMENTS.neutral.needsOnSolid).toBe(true);
		expect(FAMILY_REQUIREMENTS.accent.needsOnSolid).toBe(true);
		expect(FAMILY_REQUIREMENTS.danger.needsOnSolid).toBe(true);
		for (const role of FEEDBACK_ROLES) {
			expect(FAMILY_REQUIREMENTS[role].needsOnSolid).toBe(false);
			expect(FAMILY_REQUIREMENTS[role].needsSolidStates).toBe(false);
			// Feedback roles still guarantee the subtle surface, border, and text they publicly consume.
			expect(FAMILY_REQUIREMENTS[role].needsSubtleStates).toBe(true);
			expect(FAMILY_REQUIREMENTS[role].needsBorder).toBe(true);
			expect(FAMILY_REQUIREMENTS[role].needsText).toBe(true);
		}
	});
});

describe('generateFamily shape', () => {
	it('returns all twelve steps plus a contrast colour', () => {
		const scale = family('#0090ff', 'light', 'accent');
		for (let step = 1; step <= 12; step++) {
			const rung = scale[step as 1];
			expect(Number.isFinite(rung.l)).toBe(true);
			expect(rung.l).toBeGreaterThanOrEqual(0);
			expect(rung.l).toBeLessThanOrEqual(1);
			expect(rung.c).toBeGreaterThanOrEqual(0);
		}
		expect(Number.isFinite(scale.contrast.l)).toBe(true);
	});
});

describe('component state distinctness', () => {
	it('keeps steps 3-4 and 4-5 at least MIN_STATE_DELTA apart across the corpus', () => {
		for (const entry of HUE_STRESS_CORPUS) {
			for (const mode of MODES) {
				// The muted ramp is role-independent, so any role that generates cleanly exercises it;
				// feedback roles never throw, so they cover every corpus source.
				for (const role of [...FEEDBACK_ROLES, 'neutral', 'accent'] as const) {
					const scale = family(entry.source, mode, role);
					const delta34 = oklabDeltaE(scale[3], scale[4]);
					const delta45 = oklabDeltaE(scale[4], scale[5]);
					expect(delta34, `${entry.name} ${mode} ${role} ΔE(3,4)`).toBeGreaterThanOrEqual(
						MIN_STATE_DELTA,
					);
					expect(delta45, `${entry.name} ${mode} ${role} ΔE(4,5)`).toBeGreaterThanOrEqual(
						MIN_STATE_DELTA,
					);
				}
			}
		}
	});
});

describe('on-solid contrast guarantee', () => {
	it('clears 4.5:1 against the solid (9) and its hover (10) for needsOnSolid roles across the corpus', () => {
		for (const entry of HUE_STRESS_CORPUS) {
			for (const mode of MODES) {
				for (const role of NEEDS_ON_SOLID_ROLES) {
					const scale = family(entry.source, mode, role);
					expect(
						contrastRatio(scale.contrast, scale[9]),
						`${entry.name} ${mode} ${role} contrast vs 9`,
					).toBeGreaterThanOrEqual(TEXT_RATIO);
					expect(
						contrastRatio(scale.contrast, scale[10]),
						`${entry.name} ${mode} ${role} contrast vs 10`,
					).toBeGreaterThanOrEqual(TEXT_RATIO);
				}
			}
		}
	});

	it('reports a satisfied on-solid anchor for needsOnSolid roles', () => {
		const { diagnostics } = generateFamilyWithDiagnostics({
			background: BACKGROUND.light,
			mode: 'light',
			role: 'accent',
			source: parseColor('#0090ff'),
		});
		expect(diagnostics.solidAnchor.satisfied).toBe(true);
		expect(diagnostics.solidAnchor.onSolidRatioSolid).toBeGreaterThanOrEqual(TEXT_RATIO);
		expect(diagnostics.solidAnchor.onSolidRatioSolidHover).toBeGreaterThanOrEqual(TEXT_RATIO);
	});
});

describe('reference-envelope properties', () => {
	// Union envelopes across several Radix families bound the muted-ramp steps (1-8). The solid and
	// text rungs (9-12) are Luke UI design choices, not Radix-pinned, so they are not envelope-checked.
	const LIGHTNESS_TOLERANCE = 0.07;
	const CHROMA_TOLERANCE = 0.06;
	const envelopes: Record<
		ColorMode,
		{ lightness: Array<[number, number]>; chroma: Array<[number, number]> }
	> = {
		dark: {
			chroma: chromaEnvelope(RADIX_DARK_OKLCH),
			lightness: lightnessEnvelope(RADIX_DARK_OKLCH),
		},
		light: {
			chroma: chromaEnvelope(RADIX_LIGHT_OKLCH),
			lightness: lightnessEnvelope(RADIX_LIGHT_OKLCH),
		},
	};

	// A neutral family (from a near-canvas gray) and a vibrant blue accent, in each mode.
	const cases: Array<{ name: string; source: string; role: FamilyRole }> = [
		{ name: 'neutral', role: 'neutral', source: 'oklch(0.99 0.003 250)' },
		{ name: 'blue accent', role: 'accent', source: '#0090ff' },
	];

	for (const mode of MODES) {
		for (const testCase of cases) {
			it(`keeps ${testCase.name} background/border steps inside the ${mode} lightness envelope`, () => {
				const source =
					mode === 'light' ? testCase.source : shiftedForDark(testCase.source, testCase.role);
				const scale = family(source, mode, testCase.role);
				const { chroma, lightness } = envelopes[mode];
				for (let step = 1; step <= 8; step++) {
					const rung = scale[step as 1];
					const lightnessBounds = lightness[step - 1];
					const chromaBounds = chroma[step - 1];
					if (lightnessBounds === undefined || chromaBounds === undefined) {
						throw new Error(`missing envelope bounds for step ${step}`);
					}
					const [lMin, lMax] = lightnessBounds;
					expect(rung.l, `${testCase.name} ${mode} step ${step} L`).toBeGreaterThanOrEqual(
						lMin - LIGHTNESS_TOLERANCE,
					);
					expect(rung.l, `${testCase.name} ${mode} step ${step} L`).toBeLessThanOrEqual(
						lMax + LIGHTNESS_TOLERANCE,
					);
					// Chroma only needs an upper bound: a paler-than-Radix tint is always acceptable.
					expect(rung.c, `${testCase.name} ${mode} step ${step} C`).toBeLessThanOrEqual(
						chromaBounds[1] + CHROMA_TOLERANCE,
					);
				}
			});
		}
	}

	it('walks the muted ramp monotonically away from the background', () => {
		for (const mode of MODES) {
			const scale = family('#0090ff', mode, 'accent');
			for (let step = 1; step < 8; step++) {
				const here = scale[step as 1].l;
				const next = scale[(step + 1) as 1].l;
				// Light mode ramps darker, dark mode ramps lighter: the signed move away from the
				// background is never negative either way.
				const awayFromBackground = mode === 'light' ? here - next : next - here;
				expect(awayFromBackground, `${mode} step ${step + 1}`).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it('peaks chroma at the solid, above the background steps', () => {
		for (const mode of MODES) {
			const scale = family('#0090ff', mode, 'accent');
			for (const step of [1, 2, 3, 4, 5, 6] as const) {
				expect(scale[9].c, `${mode} step ${step} vs solid`).toBeGreaterThanOrEqual(scale[step].c);
			}
		}
	});
});

describe('step 12 is a scale-quality rung, not a contract guarantee', () => {
	it('is the more extreme text lightness but carries no contrast guarantee', () => {
		for (const mode of MODES) {
			const scale = family('#0090ff', mode, 'accent');
			// Light mode: high-contrast text is darker than low-contrast; dark mode: lighter. Either
			// way step 12 sits further from the low-contrast rung, extending the ramp.
			const extension = mode === 'light' ? scale[11].l - scale[12].l : scale[12].l - scale[11].l;
			expect(extension).toBeGreaterThan(0);
		}
	});
});

describe('solid-anchor search', () => {
	it('honours the source lightness when it already clears the on-solid gate', () => {
		const { diagnostics } = generateFamilyWithDiagnostics({
			background: BACKGROUND.dark,
			mode: 'dark',
			role: 'accent',
			source: parseColor('#0090ff'),
		});
		expect(diagnostics.solidAnchor.adaptedForOnSolid).toBe(false);
		expect(diagnostics.solidAnchor.resolvedLightness).toBeCloseTo(parseColor('#0090ff').l, 5);
	});

	it('nudges the solid off the source lightness when the source itself fails the gate', () => {
		const source = parseColor('#3b82f6');
		const { diagnostics } = generateFamilyWithDiagnostics({
			background: BACKGROUND.light,
			mode: 'light',
			role: 'accent',
			source,
		});
		expect(diagnostics.solidAnchor.adaptedForOnSolid).toBe(true);
		expect(diagnostics.solidAnchor.resolvedLightness).not.toBeCloseTo(source.l, 3);
		// The nudge stays within the tone-faithful window.
		expect(Math.abs(diagnostics.solidAnchor.resolvedLightness - source.l)).toBeLessThanOrEqual(
			0.036,
		);
	});

	it('never distorts a feedback family: the solid keeps the source lightness exactly', () => {
		for (const role of FEEDBACK_ROLES) {
			for (const mode of MODES) {
				const source = parseColor('oklch(0.6 0.14 80)');
				const { diagnostics } = generateFamilyWithDiagnostics({
					background: BACKGROUND[mode],
					mode,
					role,
					source,
				});
				expect(diagnostics.solidAnchor.adaptedForOnSolid, `${role} ${mode}`).toBe(false);
				expect(diagnostics.solidAnchor.resolvedLightness, `${role} ${mode}`).toBeCloseTo(
					source.l,
					5,
				);
			}
		}
	});

	it('keeps the neutral solid accessible in both modes', () => {
		for (const mode of MODES) {
			const scale = family('oklch(0.99 0.003 250)', mode, 'neutral');
			expect(contrastRatio(scale.contrast, scale[9]), `neutral ${mode}`).toBeGreaterThanOrEqual(
				TEXT_RATIO,
			);
			expect(contrastRatio(scale.contrast, scale[10]), `neutral ${mode}`).toBeGreaterThanOrEqual(
				TEXT_RATIO,
			);
		}
	});
});

describe('unsatisfiable input', () => {
	it('throws ScaleGenerationError carrying role and mode when a needsOnSolid tone is a dead zone', () => {
		for (const mode of MODES) {
			const entry = UNSATISFIABLE_ON_SOLID[mode];
			for (const role of ['accent', 'danger'] as const) {
				let thrown: unknown;
				try {
					family(entry.source, mode, role);
				} catch (error) {
					thrown = error;
				}
				expect(thrown, `${entry.name} ${role}`).toBeInstanceOf(ScaleGenerationError);
				const error = thrown as ScaleGenerationError;
				expect(error.role).toBe(role);
				expect(error.mode).toBe(mode);
				expect(error.bestAttempt.step).toBe(9);
				expect(error.bestAttempt.onSolidRatio).toBeLessThan(TEXT_RATIO);
			}
		}
	});

	it('does not throw for feedback roles given the same dead-zone tone', () => {
		for (const mode of MODES) {
			for (const role of FEEDBACK_ROLES) {
				expect(() => family(UNSATISFIABLE_ON_SOLID[mode].source, mode, role)).not.toThrow();
			}
		}
	});
});

describe('gamut-reduction diagnostics', () => {
	it('records the rungs whose chroma the sRGB gamut forced down for an out-of-gamut source', () => {
		const { diagnostics } = generateFamilyWithDiagnostics({
			background: BACKGROUND.light,
			mode: 'light',
			role: 'accent',
			source: parseColor('oklch(0.7 0.4 195)'),
		});
		expect(diagnostics.gamutReductions.length).toBeGreaterThan(0);
		expect(diagnostics.gamutReductions.some((reduction) => reduction.step === 9)).toBe(true);
		for (const reduction of diagnostics.gamutReductions) {
			expect(reduction.resolvedChroma).toBeLessThan(reduction.requestedChroma);
		}
	});

	it('records no reduction for an in-gamut low-chroma neutral', () => {
		const { diagnostics } = generateFamilyWithDiagnostics({
			background: BACKGROUND.light,
			mode: 'light',
			role: 'neutral',
			source: parseColor('oklch(0.99 0.003 250)'),
		});
		expect(diagnostics.gamutReductions).toEqual([]);
	});
});

// Dark canvases invert the character lightness, so neutral character sources move dark while a
// vibrant accent keeps its hue. Keeps the envelope cases honest per mode.
function shiftedForDark(source: string, role: FamilyRole): string {
	if (role !== 'neutral') return source;
	return 'oklch(0.18 0.004 250)';
}
