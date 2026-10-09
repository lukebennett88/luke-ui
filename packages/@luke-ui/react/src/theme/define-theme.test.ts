import { describe, expect, it } from 'vite-plus/test';
import { splitBlocks } from './__fixtures__/theme-css.js';
import { compileTheme, ThemeContrastError } from './build-theme.js';
import { gamutMapOklch, parseColor } from './color.js';
import type { ThemeInput } from './define-theme.js';
import { defaultBackdrop, defaultDepth, defineTheme, normalizeTheme } from './define-theme.js';
import { defaultSourceColors } from './foundation.js';
import { paperTheme } from './foundations/paper.js';
import { tactileTheme } from './foundations/tactile.js';
import { FAMILY_RUNG } from './scale.js';

const VAR_VALUE_PATTERN_CACHE = new Map<string, RegExp>();

function getVarValuePattern(varName: string): RegExp {
	let pattern = VAR_VALUE_PATTERN_CACHE.get(varName);
	if (pattern === undefined) {
		pattern = new RegExp(`${varName}: ([^;]+);`);
		VAR_VALUE_PATTERN_CACHE.set(varName, pattern);
	}
	return pattern;
}

function extractValue(block: string, varName: string): string {
	const match = getVarValuePattern(varName).exec(block);
	if (match === null || match[1] === undefined) throw new Error(`missing ${varName} in block`);
	return match[1];
}

const ACCENT_SOLID = '--luke-color-background-accent-solid-rest';

describe('defineTheme single-value accent adaptation', () => {
	const accents = ['#3b82f6', 'oklch(0.7 0.15 320)'];

	for (const accent of accents) {
		it(`adapts ${accent} to an accessible light and dark accent via a per-mode search`, () => {
			// buildTheme throws ThemeContrastError on any breach, so reaching the assertions proves the
			// adapted accent is accessible in both modes.
			const blocks = splitBlocks(defineTheme({ color: { accent }, name: 'accent-adapt' }));
			const lightSolid = parseColor(extractValue(blocks.baseLight, ACCENT_SOLID));
			const darkSolid = parseColor(extractValue(blocks.mediaDark, ACCENT_SOLID));
			const source = gamutMapOklch(parseColor(accent));

			// The source hue is preserved; only the lightness (and gamut-clamped chroma) is adapted.
			expect(lightSolid.h).toBeCloseTo(source.h, 0);
			expect(darkSolid.h).toBeCloseTo(source.h, 0);

			// Each mode lands in its own vibrant band near the mode target (~0.5 light, ~0.72 dark).
			expect(lightSolid.l).toBeCloseTo(0.5, 1);
			expect(darkSolid.l).toBeCloseTo(0.72, 1);

			// A naive passthrough would emit the source lightness verbatim for both modes; a per-mode
			// search instead moves the lightness independently, so the modes differ and at least one
			// mode is moved off the source lightness.
			expect(lightSolid.l).not.toBeCloseTo(darkSolid.l, 2);
			const movedFromSource =
				Math.abs(lightSolid.l - source.l) > 0.01 || Math.abs(darkSolid.l - source.l) > 0.01;
			expect(movedFromSource).toBe(true);
		});
	}
});

describe('defineTheme accent pre-conditioning shares the generator gate', () => {
	const accents = [
		'#3b82f6',
		'#ef4444',
		'#22c55e',
		'#eab308',
		'#f97316',
		'oklch(0.7 0.15 320)',
		'oklch(0.6 0.12 160)',
		'oklch(0.5 0.2 270)',
		// Tones the generator cannot reach through its tone-faithful window, which is an on-solid dead
		// zone. The pre-conditioner's wider band rescues them.
		'oklch(0.62 0.19 27)',
		'oklch(0.55 0.2 258)',
	];

	it('hands the generator an accent the solid-anchor search honours verbatim in both modes', () => {
		const resolved = accents.flatMap((accent) => {
			const foundation = normalizeTheme({ color: { accent }, name: 'accent-gate' });
			const { diagnostics } = compileTheme(foundation);
			return (['light', 'dark'] as const).map((mode) => {
				const source = foundation[mode].color.accent;
				const familyDiagnostics = diagnostics[mode].families.accent;
				return {
					accent,
					mode,
					reSearched: familyDiagnostics.solidAnchor.adaptedForOnSolid,
					solidMovedOffPreconditionedTone:
						Math.abs(familyDiagnostics.family[FAMILY_RUNG.solid].l - source.l) > 1e-9 ||
						Math.abs(familyDiagnostics.solidAnchor.resolvedLightness - source.l) > 1e-9,
				};
			});
		});
		expect(
			resolved.filter((entry) => entry.reSearched || entry.solidMovedOffPreconditionedTone),
		).toEqual([]);
	});
});

describe('defineTheme partial per-mode merges', () => {
	it('merges a partial depth ladder per mode without cross-mode bleed', () => {
		const overlay = 'X';
		const blocks = splitBlocks(
			defineTheme({
				color: { accent: '#3b82f6' },
				depth: { light: { overlay } },
				name: 'partial-depth',
			}),
		);
		// The authored light rung wins; the other light rungs keep the light default.
		expect(extractValue(blocks.baseLight, '--luke-depth-overlay')).toBe(overlay);
		expect(extractValue(blocks.baseLight, '--luke-depth-resting')).toBe(defaultDepth.light.resting);
		// Dark is untouched: every dark rung, including overlay, keeps the dark default.
		expect(extractValue(blocks.mediaDark, '--luke-depth-overlay')).toBe(defaultDepth.dark.overlay);
		expect(extractValue(blocks.mediaDark, '--luke-depth-resting')).toBe(defaultDepth.dark.resting);
	});

	it('falls back to the curated default for a rung explicitly authored as undefined', () => {
		// Composed authoring naturally produces `{ resting: condition ? value : undefined }`. An
		// explicit `undefined` must behave exactly like an omitted rung, not overwrite the default with
		// `undefined` or reach the validator's `.trim()` guard.
		const blocks = splitBlocks(
			defineTheme({
				color: { accent: '#3b82f6' },
				depth: { light: { resting: undefined } },
				name: 'undefined-depth-rung',
			}),
		);
		expect(extractValue(blocks.baseLight, '--luke-depth-resting')).toBe(defaultDepth.light.resting);
	});

	it('defaults the omitted dark side of a partial colour without bleeding the light override', () => {
		const infoVarNames = [
			'--luke-color-foreground-info-rest',
			'--luke-color-border-info',
			'--luke-color-background-info-subtle-rest',
		];
		const overridden = splitBlocks(
			defineTheme({ color: { accent: '#fff', info: { light: '#1d39c4' } }, name: 'partial-color' }),
		);
		const allDefault = splitBlocks(
			defineTheme({ color: { accent: '#fff' }, name: 'partial-color-default' }),
		);
		// The omitted dark info side falls back to the curated default: identical to the all-default build.
		for (const varName of infoVarNames) {
			expect(extractValue(overridden.mediaDark, varName)).toBe(
				extractValue(allDefault.mediaDark, varName),
			);
		}
		// The explicit light info override changed the light info kit and did not bleed into dark.
		const overriddenLight = infoVarNames.map((varName) => {
			return extractValue(overridden.baseLight, varName);
		});
		const defaultLight = infoVarNames.map((varName) => extractValue(allDefault.baseLight, varName));
		expect(overriddenLight).not.toEqual(defaultLight);
	});
});

describe('defineTheme backdrop validation', () => {
	it('rejects an unsafe authored backdrop value with a message naming the field', () => {
		// Backdrop is deliberately excluded from OKLCH colour parsing (its alpha channel does not fit
		// that pattern) and emitted verbatim, so it needs its own shape check rather than none at all.
		expect(() => {
			return defineTheme({
				color: { accent: '#3b82f6', backdrop: 'oklch(0 0 0 / 0.2); } .evil {' },
				name: 'unsafe-backdrop',
			});
		}).toThrow('light.color.backdrop: must be a non-empty CSS colour value');
	});
});

describe('normalizeTheme resolves `surface.base` split from `neutral`', () => {
	it('omitted base resolves to the resolved neutral base anchor in both modes', () => {
		const foundation = normalizeTheme({
			color: {
				accent: '#3b82f6',
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'base-omitted',
		});
		expect(foundation.light.color.surface.base).toBe(foundation.light.color.neutral);
		expect(foundation.dark.color.surface.base).toBe(foundation.dark.color.neutral);
	});

	it('omitted base also coincides with a curated neutralStyle', () => {
		const foundation = normalizeTheme({
			color: { accent: '#3b82f6', neutralStyle: 'warm' },
			name: 'base-omitted-style',
		});
		expect(foundation.light.color.surface.base).toBe(foundation.light.color.neutral);
		expect(foundation.dark.color.surface.base).toBe(foundation.dark.color.neutral);
	});

	it('an explicit per-mode base wins over the neutral base anchor', () => {
		const foundation = normalizeTheme({
			color: {
				accent: '#3b82f6',
				surface: { base: { dark: 'oklch(0.18 0.01 210)', light: 'oklch(0.99 0.002 210)' } },
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'base-explicit',
		});
		expect(foundation.light.color.surface.base).toEqual(
			gamutMapOklch(parseColor('oklch(0.99 0.002 210)')),
		);
		expect(foundation.dark.color.surface.base).toEqual(
			gamutMapOklch(parseColor('oklch(0.18 0.01 210)')),
		);
		// Different from the neutral base anchor: the split actually took effect.
		expect(foundation.light.color.surface.base).not.toBe(foundation.light.color.neutral);
		expect(foundation.dark.color.surface.base).not.toBe(foundation.dark.color.neutral);
	});

	it('a single-mode base is adapted to the opposite mode base lightness, not copied verbatim', () => {
		const foundation = normalizeTheme({
			color: {
				accent: '#3b82f6',
				surface: { base: { light: 'oklch(0.4 0.05 30)' } },
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'base-single-mode',
		});
		// Light keeps the authored value verbatim.
		expect(foundation.light.color.surface.base).toEqual(
			gamutMapOklch(parseColor('oklch(0.4 0.05 30)')),
		);
		// Dark is adapted from light: same hue and chroma, but the dark base lightness (~0.22), not
		// the light source's lightness (0.4) and not a raw copy of the light colour.
		const adaptedDark = foundation.dark.color.surface.base;
		expect(adaptedDark.h).toBeCloseTo(30, 0);
		expect(adaptedDark.c).toBeCloseTo(0.05, 2);
		expect(adaptedDark.l).toBeCloseTo(0.22, 2);
		expect(foundation.dark.color.surface.base).not.toBe(foundation.light.color.surface.base);
		// And it still differs from the resolved dark neutral base anchor (the base is split).
		expect(foundation.dark.color.surface.base).not.toBe(foundation.dark.color.neutral);
	});

	it('a single-value base string adapts independently per mode, mirroring single-value neutral', () => {
		const foundation = normalizeTheme({
			color: { accent: '#3b82f6', surface: { base: 'oklch(0.5 0.03 140)' } },
			name: 'base-single-value',
		});
		const light = foundation.light.color.surface.base;
		const dark = foundation.dark.color.surface.base;
		expect(light.h).toBeCloseTo(140, 0);
		expect(dark.h).toBeCloseTo(140, 0);
		expect(light.l).toBeCloseTo(0.985, 2);
		expect(dark.l).toBeCloseTo(0.22, 2);
	});
});

describe('normalizeTheme carries authored surfaces', () => {
	it('passes an authored surface side through and leaves the rest for generation', () => {
		const foundation = normalizeTheme({
			color: {
				accent: '#3b82f6',
				surface: { field: { light: 'oklch(0.97 0 0)' }, overlay: { dark: 'oklch(0.3 0 0)' } },
			},
			name: 'authored-surfaces',
		});
		expect(foundation.light.color.surface.field).toEqual(
			gamutMapOklch(parseColor('oklch(0.97 0 0)')),
		);
		expect(foundation.light.color.surface.overlay).toBeUndefined();
		expect(foundation.dark.color.surface.field).toBeUndefined();
		expect(foundation.dark.color.surface.overlay).toEqual(
			gamutMapOklch(parseColor('oklch(0.3 0 0)')),
		);
		expect(foundation.light.color.surface.subdued).toBeUndefined();
	});

	it('emits an authored surface exactly and generates the others from the base', () => {
		const blocks = splitBlocks(
			defineTheme({
				color: { accent: '#3b82f6', surface: { subdued: { light: 'oklch(0.9 0 0)' } } },
				name: 'authored-subdued',
			}),
		);
		expect(extractValue(blocks.baseLight, '--luke-color-surface-subdued')).toBe('oklch(0.9 0 0)');
		expect(extractValue(blocks.baseLight, '--luke-color-surface-field')).toBe(
			extractValue(blocks.baseLight, '--luke-color-surface-base'),
		);
	});

	it('lets an author replace a generated surface that fails a contrast gate', () => {
		// A lighter dark base pushes the generated overlay, which sits above the base, under the text
		// gate. The surface is reported rather than repaired, and authoring it clears its failures.
		const base = { dark: 'oklch(0.33 0 0)', light: 'oklch(0.985 0 0)' };
		function overlayFailures(surface: NonNullable<ThemeInput['color']['surface']>) {
			try {
				defineTheme({ color: { accent: '#3b82f6', surface }, name: 'weak-overlay' });
				return [];
			} catch (error) {
				if (!(error instanceof ThemeContrastError)) throw error;
				return error.failures.filter((failure) => failure.background === 'color.surface.overlay');
			}
		}

		expect(overlayFailures({ base })).toContainEqual(
			expect.objectContaining({ foreground: 'color.text.secondary', mode: 'dark' }),
		);
		expect(overlayFailures({ base, overlay: { dark: base.dark } })).toEqual([]);
	});
});

describe('normalizeTheme resolves source colours once onto the foundation', () => {
	it('carries generator colours as Oklch and backdrop as CSS text, with defaults applied', () => {
		const foundation = normalizeTheme({
			color: { accent: '#3b82f6' },
			name: 'resolved-once',
		});
		const light = foundation.light.color;
		expect(Number.isFinite(light.accent.l)).toBe(true);
		expect(Number.isFinite(light.accent.c)).toBe(true);
		expect(Number.isFinite(light.accent.h)).toBe(true);
		expect(light.info).toEqual(gamutMapOklch(parseColor(defaultSourceColors.light.info)));
		expect(light.success).toEqual(gamutMapOklch(parseColor(defaultSourceColors.light.success)));
		expect(light.warning).toEqual(gamutMapOklch(parseColor(defaultSourceColors.light.warning)));
		expect(light.danger).toEqual(gamutMapOklch(parseColor(defaultSourceColors.light.danger)));
		expect(light.focus).toEqual(gamutMapOklch(parseColor(defaultSourceColors.light.focus)));
		expect(light.backdrop).toBe(defaultBackdrop.light);
	});

	it('keeps the adapted accent hue without a format-parse round trip', () => {
		const source = gamutMapOklch(parseColor('#3b82f6'));
		const foundation = normalizeTheme({ color: { accent: '#3b82f6' }, name: 'precision' });
		expect(foundation.light.color.accent.h).toBe(source.h);
		expect(foundation.dark.color.accent.h).toBe(source.h);
	});
});

describe('defineTheme emits interactive semantic ramps for the bundled themes', () => {
	for (const [name, input] of [
		['tactile', tactileTheme],
		['paper', paperTheme],
	] as const) {
		const css = defineTheme(input);

		it(`${name} paints info, success, and warning with a real interactive ramp`, () => {
			const blocks = splitBlocks(css);
			for (const block of [blocks.baseLight, blocks.mediaDark]) {
				for (const role of ['info', 'success', 'warning']) {
					const ramp = [
						`--luke-color-background-${role}-subtle-rest`,
						`--luke-color-background-${role}-subtle-hover`,
						`--luke-color-background-${role}-subtle-pressed`,
						`--luke-color-background-${role}-solid-rest`,
						`--luke-color-background-${role}-solid-hover`,
						`--luke-color-background-${role}-solid-pressed`,
					].map((varName) => extractValue(block, varName));
					expect(new Set(ramp).size).toBe(ramp.length);
					expect(extractValue(block, `--luke-color-foreground-${role}-rest`)).not.toBe(
						extractValue(block, `--luke-color-foreground-${role}-hover`),
					);
					expect(extractValue(block, `--luke-color-foreground-${role}-hover`)).not.toBe(
						extractValue(block, `--luke-color-foreground-${role}-pressed`),
					);
				}
			}
		});
	}
});
