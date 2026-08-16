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
import { SEMANTIC_ROLES } from './contrast-policy.js';
import type { FamilyRole } from './scale.js';
import {
	generateFamily,
	generateFamilyWithDiagnostics,
	MIN_STATE_DELTA,
	oklabDeltaE,
	onSolidGateRatio,
	passesOnSolidGate,
	ScaleGenerationError,
} from './scale.js';

type ColorMode = 'light' | 'dark';

// Representative canvases: a near-white light canvas and a near-black dark canvas, faintly cool.
const BACKGROUND: Record<ColorMode, Oklch> = {
	dark: parseColor('oklch(0.18 0.004 250)'),
	light: parseColor('oklch(0.99 0.003 250)'),
};

const TEXT_RATIO = 4.5;
const MODES: ReadonlyArray<ColorMode> = ['light', 'dark'];
// The one split is geometric rather than semantic: neutral's solid comes from its own
// curated dark/light chip band instead of the source lightness, so it is the only role a dead-zone
// source cannot make unsatisfiable.
const SOURCE_TONED_ROLES = SEMANTIC_ROLES.filter((role) => role !== 'neutral');

function family(source: string, mode: ColorMode, role: FamilyRole) {
	return generateFamily({ background: BACKGROUND[mode], mode, role, source: parseColor(source) });
}

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
				// The muted ramp is role-independent, but every role runs the solid-anchor search, so the
				// corpus covers all six roles.
				for (const role of SEMANTIC_ROLES) {
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
	it('clears 4.5:1 against the solid (9) and its hover (10) for every role across the corpus', () => {
		for (const entry of HUE_STRESS_CORPUS) {
			for (const mode of MODES) {
				for (const role of SEMANTIC_ROLES) {
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

	it('reports a satisfied on-solid anchor', () => {
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

	it('resolves the solid identically for every source-toned role', () => {
		// The solid-anchor search is geometric, not semantic. A status role and the accent handed the
		// same character must therefore produce the same solid — this is what makes a `danger` badge
		// and an `info` badge equally able to render a solid.
		const source = parseColor('oklch(0.51 0.19 150)');
		const resolvedLightness = (mode: ColorMode, role: FamilyRole) => {
			return generateFamilyWithDiagnostics({ background: BACKGROUND[mode], mode, role, source })
				.diagnostics.solidAnchor.resolvedLightness;
		};
		const anchors = MODES.flatMap((mode) => {
			return SOURCE_TONED_ROLES.map((role) => [mode, role, resolvedLightness(mode, role)]);
		});

		// Every role in a mode must land on whatever the accent lands on, mode by mode.
		expect(anchors).toEqual(
			MODES.flatMap((mode) => {
				const accentLightness = resolvedLightness(mode, 'accent');
				return SOURCE_TONED_ROLES.map((role) => [mode, role, accentLightness]);
			}),
		);
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

describe('the one on-solid gate', () => {
	// `passesOnSolidGate` is the single predicate for "can this solid carry readable text": the
	// solid-anchor search below decides on it, and `defineTheme`'s accent pre-conditioner calls it
	// rather than keeping a second copy. These tests pin the properties that copy had drifted on.

	/** How the solid-anchor search resolved a source, or `null` when it found nothing in the band. */
	function resolveAnchor(source: Oklch, mode: ColorMode) {
		try {
			return generateFamilyWithDiagnostics({
				background: BACKGROUND[mode],
				mode,
				role: 'accent',
				source,
			}).diagnostics.solidAnchor;
		} catch (error) {
			if (error instanceof ScaleGenerationError) return null;
			throw error;
		}
	}

	it('accepts exactly the lightnesses the solid-anchor search honours verbatim', () => {
		// Swept across the generator's whole vibrant solid range, which contains `defineTheme`'s wider
		// accent adaptation bands. A lightness the gate accepts must be one the search keeps as-is. One it
		// rejects must be re-searched or reported unsatisfiable. This invariant makes the
		// pre-conditioner unable to be stricter than the solver.
		const disagreements: Array<string> = [];
		for (const mode of MODES) {
			for (const hue of [0, 100, 210, 300]) {
				for (const chroma of [0.01, 0.1, 0.2]) {
					for (let lightness = 0.3; lightness <= 0.92 + 1e-9; lightness += 0.01) {
						const source: Oklch = {
							l: lightness,
							c: chroma,
							h: hue,
						};
						const anchor = resolveAnchor(source, mode);
						const honoured =
							anchor !== null &&
							!anchor.adaptedForOnSolid &&
							Math.abs(anchor.resolvedLightness - lightness) < 1e-9;
						const gated = passesOnSolidGate({ lightness, mode, source });
						if (gated === honoured) continue;
						disagreements.push(
							`${mode} oklch(${lightness.toFixed(2)} ${chroma} ${hue}): ` +
								`gate ${gated}, search honoured ${honoured}`,
						);
					}
				}
			}
		}
		expect(disagreements).toEqual([]);
	});

	it('solves past the AA text ratio, so a pair that only just clears 4.5:1 does not pass', () => {
		// Light `oklch(0.5575 0.01 0)` reaches 4.53:1 across its solid and hover: enough for a plain 4.5
		// check, short of the headroom the gate solves for so 4-decimal emission cannot round it under.
		const source: Oklch = {
			l: 0.5575,
			c: 0.01,
			h: 0,
		};
		const ratio = onSolidGateRatio({ lightness: source.l, mode: 'light', source });
		expect(ratio).toBeGreaterThan(TEXT_RATIO);
		expect(ratio).toBeLessThan(TEXT_RATIO + 0.05);
		expect(passesOnSolidGate({ lightness: source.l, mode: 'light', source })).toBe(false);
		// And the search agrees: it moves the anchor off this lightness rather than emitting it.
		expect(resolveAnchor(source, 'light')?.adaptedForOnSolid).toBe(true);
	});

	it('tests only the solid and its hover, never a deeper pressed state the engine does not generate', () => {
		// Light `oklch(0.64 0 0)` clears 4.58:1 across the two states the engine emits. A phantom third
		// state 0.09 darker would drag it to 3.88:1 and fail. The pressed solid reuses step 10, so no
		// such colour exists and the gate must not invent one.
		const source: Oklch = {
			l: 0.64,
			c: 0,
			h: 0,
		};
		const phantomPressed = {
			l: source.l - 0.09,
			c: 0,
			h: 0,
		};
		const onSolid = family('oklch(0.64 0 0)', 'light', 'accent').contrast;
		expect(contrastRatio(onSolid, phantomPressed)).toBeLessThan(TEXT_RATIO);
		expect(onSolidGateRatio({ lightness: source.l, mode: 'light', source })).toBeGreaterThan(
			TEXT_RATIO,
		);
		expect(passesOnSolidGate({ lightness: source.l, mode: 'light', source })).toBe(true);
		expect(resolveAnchor(source, 'light')?.adaptedForOnSolid).toBe(false);
	});
});

describe('unsatisfiable input', () => {
	it('throws ScaleGenerationError carrying role and mode when a source tone is a dead zone', () => {
		for (const mode of MODES) {
			const entry = UNSATISFIABLE_ON_SOLID[mode];
			for (const role of SOURCE_TONED_ROLES) {
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

	it('does not throw for neutral, whose solid comes from a curated band rather than the source tone', () => {
		for (const mode of MODES) {
			expect(() => family(UNSATISFIABLE_ON_SOLID[mode].source, mode, 'neutral')).not.toThrow();
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
