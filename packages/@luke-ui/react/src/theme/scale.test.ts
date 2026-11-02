import { describe, expect, it } from 'vite-plus/test';
import {
	ADAPTABLE_MID_TONE,
	chromaEnvelope,
	HUE_STRESS_CORPUS,
	lightnessEnvelope,
	RADIX_DARK_OKLCH,
	RADIX_LIGHT_OKLCH,
} from './__fixtures__/radix-scales.js';
import type { Oklch } from './color.js';
import { contrastRatio, formatOklch, parseColor } from './color.js';
import {
	INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
	INTERACTION_HOVER_VISIBILITY,
	SEMANTIC_ROLES,
	TEXT_RATIO,
	VISIBILITY_MARGIN,
} from './contrast-policy.js';
import type { FamilyRole } from './scale.js';
import {
	FAMILY_RUNG,
	generateFamily,
	generateFamilyWithDiagnostics,
	highContrastText,
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

const MODES: ReadonlyArray<ColorMode> = ['light', 'dark'];
// The one split is geometric rather than semantic: neutral's solid comes from its own
// curated dark/light chip band instead of the source lightness, so it is the only role a dead-zone
// source cannot make unsatisfiable.
const SOURCE_TONED_ROLES = SEMANTIC_ROLES.filter((role) => role !== 'neutral');

function family(source: string, mode: ColorMode, role: FamilyRole) {
	const parsed = parseColor(source);
	return generateFamily({
		background: BACKGROUND[mode],
		mode,
		role,
		source: parsed,
	});
}

function familyDiagnostics(source: string | Oklch, mode: ColorMode, role: FamilyRole) {
	const parsed = typeof source === 'string' ? parseColor(source) : source;
	return generateFamilyWithDiagnostics({
		background: BACKGROUND[mode],
		mode,
		role,
		source: parsed,
	});
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

describe('muted-ramp distinctness', () => {
	it('keeps steps 3-4 and 4-5 at least MIN_STATE_DELTA apart across the corpus', () => {
		for (const entry of HUE_STRESS_CORPUS) {
			for (const mode of MODES) {
				// The muted ramp is role-independent. Source-toned roles still each run the solid-anchor
				// search, so the corpus covers every role whose solid follows the source tone. Neutral
				// derives its mix target from its own source and is covered separately.
				for (const role of SOURCE_TONED_ROLES) {
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
	it('clears 4.5:1 against the public solid rest, hover, and pressed colours for every source-toned role across the corpus', () => {
		for (const entry of HUE_STRESS_CORPUS) {
			for (const mode of MODES) {
				for (const role of SOURCE_TONED_ROLES) {
					const { diagnostics } = familyDiagnostics(entry.source, mode, role);
					expect(
						diagnostics.onSolid.ratioRest,
						`${entry.name} ${mode} ${role} contrast vs rest`,
					).toBeGreaterThanOrEqual(TEXT_RATIO);
					expect(
						diagnostics.onSolid.ratioHover,
						`${entry.name} ${mode} ${role} contrast vs hover`,
					).toBeGreaterThanOrEqual(TEXT_RATIO);
					expect(
						diagnostics.onSolid.ratioPressed,
						`${entry.name} ${mode} ${role} contrast vs pressed`,
					).toBeGreaterThanOrEqual(TEXT_RATIO);
				}
			}
		}
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
				expect(scale[FAMILY_RUNG.solid].c, `${mode} step ${step} vs solid`).toBeGreaterThanOrEqual(
					scale[step].c,
				);
			}
		}
	});
});

describe('high-contrast text rung', () => {
	it('extends the text ramp past the low-contrast foreground', () => {
		for (const mode of MODES) {
			const scale = family('#0090ff', mode, 'accent');
			// Light mode: high-contrast text is darker than low-contrast; dark mode: lighter. Either
			// way the high-contrast rung sits further from the low-contrast rung, extending the ramp.
			const extension =
				mode === 'light'
					? scale[FAMILY_RUNG.foreground].l - scale[FAMILY_RUNG.textPrimary].l
					: scale[FAMILY_RUNG.textPrimary].l - scale[FAMILY_RUNG.foreground].l;
			expect(extension).toBeGreaterThan(0);
		}
	});

	it('matches highContrastText(source)', () => {
		// Production computes `text.primary` from the resolved neutral source, so the high-contrast
		// rung must equal it.
		const source = parseColor('oklch(0.5 0.08 40)');
		for (const mode of MODES) {
			const expected = highContrastText(source, mode);
			expect(family('oklch(0.5 0.08 40)', mode, 'neutral')[FAMILY_RUNG.textPrimary]).toEqual(
				expected,
			);
		}
	});
});

describe('solid-anchor search', () => {
	it('honours the source lightness when it already clears the on-solid gate', () => {
		const { diagnostics } = familyDiagnostics('#0090ff', 'dark', 'accent');
		expect(diagnostics.solidAnchor.adaptedForOnSolid).toBe(false);
		expect(diagnostics.solidAnchor.resolvedLightness).toBeCloseTo(parseColor('#0090ff').l, 5);
	});

	it('nudges the solid off the source lightness when the source itself fails the gate', () => {
		const source = parseColor(ADAPTABLE_MID_TONE.source);
		const { diagnostics } = familyDiagnostics(source, 'light', 'accent');
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
			return familyDiagnostics(source, mode, role).diagnostics.solidAnchor.resolvedLightness;
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
			const source = mode === 'light' ? 'oklch(0.99 0.003 250)' : 'oklch(0.18 0.004 250)';
			const { diagnostics } = familyDiagnostics(source, mode, 'neutral');
			expect(diagnostics.onSolid.ratioRest, `neutral ${mode}`).toBeGreaterThanOrEqual(TEXT_RATIO);
			expect(diagnostics.onSolid.ratioHover, `neutral ${mode}`).toBeGreaterThanOrEqual(TEXT_RATIO);
			expect(diagnostics.onSolid.ratioPressed, `neutral ${mode}`).toBeGreaterThanOrEqual(
				TEXT_RATIO,
			);
		}
	});
});

describe('the on-solid gate', () => {
	// `passesOnSolidGate` is the single predicate for whether a solid can carry readable text. The
	// solid-anchor search decides on it, and `defineTheme`'s accent pre-conditioner calls it rather
	// than keeping a second copy.

	/** How the solid-anchor search resolved a source, or `null` when it found nothing in the band. */
	function resolveAnchor(source: Oklch, mode: ColorMode) {
		try {
			return familyDiagnostics(source, mode, 'accent').diagnostics.solidAnchor;
		} catch (error) {
			if (error instanceof ScaleGenerationError) return null;
			throw error;
		}
	}

	function gate(source: Oklch, lightness = source.l) {
		return {
			lightness,
			source,
		};
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
						const gated = passesOnSolidGate(gate(source));
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
		// Light `oklch(0.5575 0.01 0)` reaches just over 4.5:1 across its public solid states: enough
		// for a plain 4.5 check, short of the headroom the gate solves for so 4-decimal emission cannot
		// round it under.
		const source: Oklch = {
			l: 0.5575,
			c: 0.01,
			h: 0,
		};
		const ratio = onSolidGateRatio(gate(source));
		expect(ratio).toBeGreaterThan(TEXT_RATIO);
		expect(ratio).toBeLessThan(TEXT_RATIO + 0.05);
		expect(passesOnSolidGate(gate(source))).toBe(false);
		// And the search agrees: it moves the anchor off this lightness rather than emitting it.
		expect(resolveAnchor(source, 'light')?.adaptedForOnSolid).toBe(true);
	});

	it('gates the public rest, hover, and pressed solids, not a phantom deeper lightness', () => {
		const source: Oklch = {
			l: 0.64,
			c: 0,
			h: 0,
		};
		const scale = family('oklch(0.64 0 0)', 'light', 'accent');
		const phantom = { l: source.l - 0.2, c: 0, h: 0 };
		expect(contrastRatio(scale.contrast, phantom)).toBeLessThan(TEXT_RATIO);
		expect(contrastRatio(scale.contrast, scale.solidPressed)).toBeGreaterThan(TEXT_RATIO);
		expect(onSolidGateRatio(gate(source))).toBeGreaterThan(TEXT_RATIO);
		expect(passesOnSolidGate(gate(source))).toBe(true);
		expect(resolveAnchor(source, 'light')?.adaptedForOnSolid).toBe(false);
	});
});

describe('dead-zone and adaptable sources', () => {
	it('reaches an accessible solid for every sampled source, because states step away from the text', () => {
		// The states only raise the text's contrast, so a solid needs readable text at rest alone. The
		// dead zone, where neither near-white nor near-black text reads, is narrower than the
		// tone-faithful window, so every source has an accessible solid inside it.
		for (const mode of MODES) {
			for (const role of SOURCE_TONED_ROLES) {
				for (const hue of [0, 60, 120, 180, 240, 300]) {
					for (const chroma of [0.05, 0.2]) {
						for (let lightness = 0.3; lightness <= 0.92 + 1e-9; lightness += 0.02) {
							const source = { l: lightness, c: chroma, h: hue };
							const { diagnostics } = familyDiagnostics(source, mode, role);
							expect(
								diagnostics.solidAnchor.satisfied,
								`${mode} ${role} oklch(${lightness.toFixed(2)} ${chroma} ${hue})`,
							).toBe(true);
						}
					}
				}
			}
		}
	});

	it('names the role, mode, and best attempt in a ScaleGenerationError', () => {
		const solid = { l: 0.6, c: 0.1, h: 20 };
		const error = new ScaleGenerationError('danger', 'dark', {
			lightness: 0.6,
			onSolidRatio: 4.23,
			solid,
			step: 9,
		});
		expect(error.role).toBe('danger');
		expect(error.mode).toBe('dark');
		expect(error.message).toContain('Cannot generate the dark "danger" family');
		expect(error.message).toContain('4.23:1');
	});

	it('adapts a mid-tone in the on-solid dead zone into the tone-faithful window', () => {
		const { diagnostics } = familyDiagnostics(ADAPTABLE_MID_TONE.source, 'light', 'accent');
		expect(diagnostics.solidAnchor.adaptedForOnSolid).toBe(true);
		expect(diagnostics.solidAnchor.satisfied).toBe(true);
	});

	it('reports each solid anchor’s distance to the edge of the ±0.035 window', () => {
		const source = parseColor(ADAPTABLE_MID_TONE.source);
		const { solidAnchor } = familyDiagnostics(source, 'light', 'accent').diagnostics;
		const [low, high] = solidAnchor.band;
		expect(low).toBeCloseTo(source.l - 0.035, 9);
		expect(high).toBeCloseTo(source.l + 0.035, 9);
		expect(solidAnchor.distanceToEdge).toBeCloseTo(
			Math.min(solidAnchor.resolvedLightness - low, high - solidAnchor.resolvedLightness),
			9,
		);
		// An adapted anchor has moved off the source, so it has less than the full 0.035 left.
		expect(solidAnchor.distanceToEdge).toBeGreaterThanOrEqual(0);
		expect(solidAnchor.distanceToEdge).toBeLessThan(0.035);
		// A source that already reads sits at the centre, with the whole window left.
		const unadapted = familyDiagnostics('oklch(0.5 0.15 250)', 'light', 'accent').diagnostics;
		expect(unadapted.solidAnchor.distanceToEdge).toBeCloseTo(0.035, 9);
	});

	it('does not throw for neutral, whose solid comes from a curated band rather than the source tone', () => {
		expect(() => {
			return family('oklch(0.58 0.28 0)', 'dark', 'neutral');
		}).not.toThrow();
		expect(() => {
			return family(ADAPTABLE_MID_TONE.source, 'light', 'neutral');
		}).not.toThrow();
	});
});

describe('gamut-reduction diagnostics', () => {
	it('records the rungs whose chroma the sRGB gamut forced down for an out-of-gamut source', () => {
		const { diagnostics } = familyDiagnostics('oklch(0.7 0.4 195)', 'light', 'accent');
		expect(diagnostics.gamutReductions.length).toBeGreaterThan(0);
		expect(
			diagnostics.gamutReductions.some((reduction) => reduction.step === FAMILY_RUNG.solid),
		).toBe(true);
		for (const reduction of diagnostics.gamutReductions) {
			expect(reduction.resolvedChroma).toBeLessThan(reduction.requestedChroma);
		}
	});

	it('records no reduction for an in-gamut low-chroma neutral', () => {
		const source = 'oklch(0.99 0.003 250)';
		const { diagnostics } = familyDiagnostics(source, 'light', 'neutral');
		expect(diagnostics.gamutReductions).toEqual([]);
	});
});

// Dark canvases invert the character lightness, so neutral character sources move dark while a
// vibrant accent keeps its hue. Keeps the envelope cases honest per mode.
function shiftedForDark(source: string, role: FamilyRole): string {
	if (role !== 'neutral') return source;
	return 'oklch(0.18 0.004 250)';
}

describe('solid hover and pressed states', () => {
	const sources = [
		...HUE_STRESS_CORPUS.map((entry) => entry.source),
		ADAPTABLE_MID_TONE.source,
		'oklch(0.9 0.15 100)',
		'oklch(0.35 0.1 260)',
	];

	function everyFamily() {
		return MODES.flatMap((mode) => {
			return sources.flatMap((source) => {
				return SEMANTIC_ROLES.map((role) => {
					return { ...familyDiagnostics(source, mode, role).diagnostics, input: source };
				});
			});
		});
	}

	it('steps lighter from dark on-solid text and darker from light text, and the text is the final choice', () => {
		for (const entry of everyFamily()) {
			const textIsDark = entry.onSolid.color.l < 0.5;
			expect(entry.solidStates.direction, `${entry.mode} ${entry.role} ${entry.input}`).toBe(
				textIsDark ? 'lighter' : 'darker',
			);
			const sign = textIsDark ? 1 : -1;
			expect(
				sign * (entry.solidStates.hover.l - entry.solidStates.rest.l),
				`${entry.mode} ${entry.role} ${entry.input}`,
			).toBeGreaterThan(0);
			expect(
				sign * (entry.solidStates.pressed.l - entry.solidStates.hover.l),
				`${entry.mode} ${entry.role} ${entry.input}`,
			).toBeGreaterThan(0);
			// The family's on-solid colour is the one the direction was derived from.
			expect(entry.family.contrast, `${entry.mode} ${entry.role} ${entry.input}`).toEqual(
				entry.onSolid.color,
			);
		}
	});

	it('keeps hue and chroma, subject to gamut mapping', () => {
		for (const entry of everyFamily()) {
			const { rest, hover, pressed } = entry.solidStates;
			for (const state of [hover, pressed]) {
				expect(state.h, `${entry.mode} ${entry.role}`).toBeCloseTo(rest.h, 6);
				expect(state.c, `${entry.mode} ${entry.role}`).toBeLessThanOrEqual(rest.c + 1e-9);
			}
		}
	});

	it('clears both visibility floors plus the private margin on the emitted fills', () => {
		for (const entry of everyFamily()) {
			const rest = emitted(entry.solidStates.rest);
			const hover = emitted(entry.solidStates.hover);
			const pressed = emitted(entry.solidStates.pressed);
			expect(
				oklabDeltaE(rest, hover),
				`${entry.mode} ${entry.role} ${entry.input}`,
			).toBeGreaterThanOrEqual(INTERACTION_HOVER_VISIBILITY + VISIBILITY_MARGIN);
			expect(
				oklabDeltaE(hover, pressed),
				`${entry.mode} ${entry.role} ${entry.input}`,
			).toBeGreaterThanOrEqual(INTERACTION_HOVER_TO_PRESSED_VISIBILITY + VISIBILITY_MARGIN);
			expect(
				entry.solidStates.restToHoverVisibility,
				`${entry.mode} ${entry.role} ${entry.input}`,
			).toBeCloseTo(oklabDeltaE(rest, hover), 9);
		}
	});

	it('steps no further than it must: the margin is private and small', () => {
		expect(VISIBILITY_MARGIN).toBeGreaterThan(0);
		expect(VISIBILITY_MARGIN).toBeLessThanOrEqual(0.004);
		for (const entry of everyFamily()) {
			// Within one search step of the target, plus rounding, and never a runaway step.
			expect(entry.solidStates.restToHoverVisibility).toBeLessThan(
				INTERACTION_HOVER_VISIBILITY + VISIBILITY_MARGIN + 0.002,
			);
		}
	});

	it('clears 4.5:1 for the chosen text over the emitted rest, hover, and pressed colours', () => {
		for (const entry of everyFamily()) {
			const text = emitted(entry.onSolid.color);
			for (const state of [
				entry.solidStates.rest,
				entry.solidStates.hover,
				entry.solidStates.pressed,
			]) {
				expect(
					contrastRatio(text, emitted(state)),
					`${entry.mode} ${entry.role} ${entry.input}`,
				).toBeGreaterThanOrEqual(TEXT_RATIO);
			}
		}
	});

	it('is deterministic: the same input gives the same family', () => {
		for (const mode of MODES) {
			for (const role of SEMANTIC_ROLES) {
				const first = familyDiagnostics(ADAPTABLE_MID_TONE.source, mode, role);
				const second = familyDiagnostics(ADAPTABLE_MID_TONE.source, mode, role);
				expect(second).toEqual(first);
			}
		}
	});
});

function emitted(color: Oklch): Oklch {
	return parseColor(formatOklch(color));
}
