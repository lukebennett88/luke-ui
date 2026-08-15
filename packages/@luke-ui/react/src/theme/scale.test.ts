import { describe, expect, it } from 'vite-plus/test';
import {
	chromaEnvelope,
	HUE_STRESS_CORPUS,
	lightnessEnvelope,
	RADIX_DARK_OKLCH,
	RADIX_LIGHT_OKLCH,
	MID_LIGHTNESS_TONES,
} from './__fixtures__/radix-scales.js';
import type { Oklch } from './color.js';
import { contrastRatio, parseColor } from './color.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import { mixInteractionColor } from './interaction-mix.js';
import type { FamilyRole } from './scale.js';
import {
	FAMILY_RUNGS,
	generateFamily,
	generateFamilyWithDiagnostics,
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
	it('returns the semantic rungs the contract consumes', () => {
		const scale = family('#0090ff', 'light', 'accent');
		expect(Object.keys(scale).sort()).toEqual([...FAMILY_RUNGS].sort());
		for (const name of FAMILY_RUNGS) {
			const rung = scale[name];
			expect(Number.isFinite(rung.l)).toBe(true);
			expect(rung.l).toBeGreaterThanOrEqual(0);
			expect(rung.l).toBeLessThanOrEqual(1);
			expect(rung.c).toBeGreaterThanOrEqual(0);
		}
	});
});

describe('muted ramp distinctness', () => {
	it('keeps consecutive muted rungs perceptibly apart', () => {
		for (const entry of HUE_STRESS_CORPUS) {
			for (const mode of MODES) {
				for (const role of SEMANTIC_ROLES) {
					const scale = family(entry.source, mode, role);
					expect(
						oklabDeltaE(scale.subtle, scale.decorative),
						`${entry.name} ${mode} ${role} ΔE(subtle, decorative)`,
					).toBeGreaterThan(0);
					expect(
						oklabDeltaE(scale.decorative, scale.border),
						`${entry.name} ${mode} ${role} ΔE(decorative, border)`,
					).toBeGreaterThan(0);
					expect(
						oklabDeltaE(scale.border, scale.mid),
						`${entry.name} ${mode} ${role} ΔE(border, mid)`,
					).toBeGreaterThan(0);
				}
			}
		}
	});
});

describe('on-solid contrast guarantee', () => {
	it('clears 4.5:1 against the resting solid for every role across the corpus', () => {
		for (const entry of HUE_STRESS_CORPUS) {
			for (const mode of MODES) {
				for (const role of SEMANTIC_ROLES) {
					const scale = family(entry.source, mode, role);
					expect(
						contrastRatio(scale.onSolid, scale.solid),
						`${entry.name} ${mode} ${role} onSolid vs solid`,
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
		expect(diagnostics.onSolid.ratioSolid).toBe(diagnostics.solidAnchor.onSolidRatioSolid);
	});
});

describe('reference-envelope properties', () => {
	// Union envelopes across several Radix families bound the muted rungs. Solid and text rungs
	// are Luke UI design choices, not Radix-pinned, so they are not envelope-checked.
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
			it(`keeps ${testCase.name} muted rungs inside the ${mode} lightness envelope`, () => {
				const source =
					mode === 'light' ? testCase.source : shiftedForDark(testCase.source, testCase.role);
				const scale = family(source, mode, testCase.role);
				const { chroma, lightness } = envelopes[mode];
				const muted = [
					['subtle', 2, scale.subtle],
					['decorative', 5, scale.decorative],
					['border', 6, scale.border],
					['mid', 7, scale.mid],
				] as const;
				for (const [name, envelopeIndex, rung] of muted) {
					const lightnessBounds = lightness[envelopeIndex];
					const chromaBounds = chroma[envelopeIndex];
					if (lightnessBounds === undefined || chromaBounds === undefined) {
						throw new Error(`missing envelope bounds for ${name}`);
					}
					const [lMin, lMax] = lightnessBounds;
					expect(rung.l, `${testCase.name} ${mode} ${name} L`).toBeGreaterThanOrEqual(
						lMin - LIGHTNESS_TOLERANCE,
					);
					expect(rung.l, `${testCase.name} ${mode} ${name} L`).toBeLessThanOrEqual(
						lMax + LIGHTNESS_TOLERANCE,
					);
					expect(rung.c, `${testCase.name} ${mode} ${name} C`).toBeLessThanOrEqual(
						chromaBounds[1] + CHROMA_TOLERANCE,
					);
				}
			});
		}
	}

	it('walks the muted rungs monotonically away from the background', () => {
		for (const mode of MODES) {
			const scale = family('#0090ff', mode, 'accent');
			const rungs = [scale.subtle, scale.decorative, scale.border, scale.mid];
			for (let index = 0; index < rungs.length - 1; index++) {
				const here = rungs[index]?.l;
				const next = rungs[index + 1]?.l;
				if (here === undefined || next === undefined) throw new Error('missing muted rung');
				const awayFromBackground = mode === 'light' ? here - next : next - here;
				expect(awayFromBackground, `${mode} muted ${index}`).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it('peaks chroma at the solid, above the muted rungs', () => {
		for (const mode of MODES) {
			const scale = family('#0090ff', mode, 'accent');
			for (const rung of [scale.subtle, scale.decorative, scale.border] as const) {
				expect(scale.solid.c, `${mode} vs solid`).toBeGreaterThanOrEqual(rung.c);
			}
		}
	});
});

describe('high-contrast text', () => {
	it('keeps the ordinary foreground readable on the pressed subtle fill', () => {
		for (const mode of MODES) {
			const scale = family('#0090ff', mode, 'accent');
			const pressedSubtle = mixInteractionColor(scale.subtle, scale.highContrast, 'pressed');
			expect(contrastRatio(scale.foreground, pressedSubtle)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('sits further from the background than the ordinary foreground', () => {
		for (const mode of MODES) {
			const scale = family('#0090ff', mode, 'accent');
			const extension =
				mode === 'light'
					? scale.foreground.l - scale.highContrast.l
					: scale.highContrast.l - scale.foreground.l;
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
		const source = parseColor('oklch(0.59 0.19 27)');
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
			expect(contrastRatio(scale.onSolid, scale.solid), `neutral ${mode}`).toBeGreaterThanOrEqual(
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
		// Light `oklch(0.5575 0.01 0)` reaches just over 4.5:1 against the resting solid: enough for a
		// plain 4.5 check, short of the headroom the gate solves for so 4-decimal emission cannot round
		// it under.
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

	it('gates the resting solid', () => {
		const source: Oklch = {
			l: 0.64,
			c: 0,
			h: 0,
		};
		expect(onSolidGateRatio({ lightness: source.l, mode: 'light', source })).toBeGreaterThan(
			TEXT_RATIO,
		);
		expect(passesOnSolidGate({ lightness: source.l, mode: 'light', source })).toBe(true);
		expect(resolveAnchor(source, 'light')?.adaptedForOnSolid).toBe(false);
	});
});

describe('mid-lightness solid search', () => {
	it('adapts a mid-lightness source within the solid search band', () => {
		for (const mode of MODES) {
			const entry = MID_LIGHTNESS_TONES[mode];
			for (const role of SOURCE_TONED_ROLES) {
				const { diagnostics } = generateFamilyWithDiagnostics({
					background: BACKGROUND[mode],
					mode,
					role,
					source: parseColor(entry.source),
				});
				expect(diagnostics.solidAnchor.satisfied, `${entry.name} ${role}`).toBe(true);
				expect(diagnostics.solidAnchor.onSolidRatioSolid).toBeGreaterThanOrEqual(TEXT_RATIO);
			}
		}
	});

	it('generates neutral from a mid-lightness source using the curated solid band', () => {
		for (const mode of MODES) {
			expect(() => family(MID_LIGHTNESS_TONES[mode].source, mode, 'neutral')).not.toThrow();
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
		expect(diagnostics.gamutReductions.some((reduction) => reduction.rung === 'solid')).toBe(true);
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
