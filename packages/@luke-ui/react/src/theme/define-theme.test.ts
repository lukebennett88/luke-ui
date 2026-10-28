import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { defineTheme, ThemeGenerationError } from '../exports/theme/compiler.js';
import { paperTheme } from './__fixtures__/paper.js';
import { UNSATISFIABLE_ON_SOLID } from './__fixtures__/radix-scales.js';
import { tactileTheme } from './__fixtures__/tactile.js';
import { loraFont, splitBlocks, testTypography } from './__fixtures__/theme-css.js';
import { compileTheme } from './build-theme.js';
import { gamutMapOklch, parseColor } from './color.js';
import type { ThemeInput } from './define-theme.js';
import { defaultBackdrop, defaultDepth, normalizeTheme } from './define-theme.js';
import { defaultSourceColors } from './foundation.js';
import { ThemeInteractionTintError } from './interaction-tints.js';
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
	const accents = ['#3b82f6', 'oklch(0.7 0.15 320)', UNSATISFIABLE_ON_SOLID.source];

	for (const accent of accents) {
		it(`adapts ${accent} to an accessible light and dark accent via a per-mode search`, () => {
			// buildTheme throws ThemeContrastError on any breach, so reaching the assertions proves the
			// adapted accent is accessible in both modes.
			const blocks = splitBlocks(
				defineTheme({ color: { accent }, name: 'accent-adapt', typography: testTypography }),
			);
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

describe('defineTheme explicit per-mode accent generation', () => {
	it('reports the failed accent search and completed families through the public compiler error', () => {
		const error = (() => {
			try {
				defineTheme({
					color: { accent: { light: '#3b82f6', dark: UNSATISFIABLE_ON_SOLID.source } },
					name: 'inaccessible-accent',
					typography: testTypography,
				});
				return null;
			} catch (caught) {
				return caught;
			}
		})();
		expect(error).toBeInstanceOf(ThemeGenerationError);
		if (!(error instanceof ThemeGenerationError)) throw error;
		expect(error.name).toBe('ThemeGenerationError');
		expect(error.role).toBe('accent');
		expect(error.mode).toBe('dark');
		expect(error.bestAttempt.step).toBe(9);
		expect(error.bestAttempt.onSolidRatio).toBeGreaterThan(1);
		expect(error.bestAttempt.onSolidRatio).toBeLessThan(4.5);
		expect(error.bestAttempt.solid.l).toBe(error.bestAttempt.lightness);
		expect(error.message).toContain(`${error.bestAttempt.onSolidRatio.toFixed(2)}:1`);
		expect(error.diagnostics.role).toBe(error.role);
		expect(error.diagnostics.mode).toBe(error.mode);
		expect(Object.keys(error.diagnostics.completedFamilies)).toEqual(['neutral']);
		expect(error.diagnostics.completedFamilies.neutral).toMatchObject({
			mode: 'dark',
			role: 'neutral',
			solidAnchor: { satisfied: true },
		});
	});
});

describe('defineTheme accent pre-conditioning shares the generator gate', () => {
	const accents = [
		'#3b82f6',
		// Tones the generator cannot reach through its tone-faithful window, which is an on-solid dead
		// zone. The pre-conditioner's wider band rescues them.
		'oklch(0.62 0.19 27)',
		'oklch(0.55 0.2 258)',
	];

	it('hands the generator an accent the solid-anchor search honours verbatim in both modes', () => {
		const resolved = accents.flatMap((accent) => {
			const foundation = normalizeTheme({
				color: { accent },
				name: 'accent-gate',
				typography: testTypography,
			});
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
				typography: testTypography,
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
				typography: testTypography,
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
			defineTheme({
				color: { accent: '#fff', info: { light: '#1d39c4' } },
				name: 'partial-color',
				typography: testTypography,
			}),
		);
		const allDefault = splitBlocks(
			defineTheme({
				color: { accent: '#fff' },
				name: 'partial-color-default',
				typography: testTypography,
			}),
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
				typography: testTypography,
			});
		}).toThrow('color.backdrop: must be a non-empty CSS colour value');
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
			typography: testTypography,
		});
		expect(foundation.light.color.surface.base).toBe(foundation.light.color.neutral);
		expect(foundation.dark.color.surface.base).toBe(foundation.dark.color.neutral);
	});

	it('omitted base also coincides with a curated neutral style', () => {
		const foundation = normalizeTheme({
			color: { accent: '#3b82f6', neutral: { style: 'warm' } },
			name: 'base-omitted-style',
			typography: testTypography,
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
			typography: testTypography,
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
			typography: testTypography,
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
			typography: testTypography,
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
				surface: { subdued: { light: 'oklch(0.97 0 0)' }, raised: { dark: 'oklch(0.3 0 0)' } },
			},
			name: 'authored-surfaces',
			typography: testTypography,
		});
		expect(foundation.light.color.surface.subdued).toEqual(
			gamutMapOklch(parseColor('oklch(0.97 0 0)')),
		);
		expect(foundation.light.color.surface.raised).toBeUndefined();
		expect(foundation.dark.color.surface.subdued).toBeUndefined();
		expect(foundation.dark.color.surface.raised).toEqual(
			gamutMapOklch(parseColor('oklch(0.3 0 0)')),
		);
	});

	it('emits an authored surface exactly and generates the others from the base', () => {
		const blocks = splitBlocks(
			defineTheme({
				color: { accent: '#3b82f6', surface: { subdued: { light: 'oklch(0.94 0 0)' } } },
				name: 'authored-subdued',
				typography: testTypography,
			}),
		);
		expect(extractValue(blocks.baseLight, '--luke-color-surface-subdued')).toBe('oklch(0.94 0 0)');
		expect(extractValue(blocks.baseLight, '--luke-color-surface-raised')).toBe('oklch(1 0 0)');
		expect(blocks.baseLight).not.toContain('--luke-color-surface-field');
	});

	it('rejects an authored surface that leaves the hover-to-pressed step below the visibility floor', () => {
		expect(() =>
			defineTheme({
				color: { accent: '#3b82f6', surface: { subdued: { light: 'oklch(0.9 0 0)' } } },
				name: 'invisible-subdued',
				typography: testTypography,
			}),
		).toThrow(ThemeInteractionTintError);
	});

	it('lets an author replace a generated surface that fails tint contrast validation', () => {
		// The generated raised surface on this dark base leaves no visible tint pair below the contrast cap.
		// Replacing that surface with the base colour clears the tint gate.
		const base = { dark: 'oklch(0.3 0 0)', light: 'oklch(0.985 0 0)' };
		function themeError(surface: NonNullable<ThemeInput['color']['surface']>): unknown {
			try {
				defineTheme({
					color: { accent: '#3b82f6', surface },
					name: 'weak-overlay',
					typography: testTypography,
				});
				return null;
			} catch (error) {
				return error;
			}
		}

		const generatedError = themeError({ base });
		expect(generatedError).toBeInstanceOf(ThemeInteractionTintError);
		if (!(generatedError instanceof ThemeInteractionTintError)) throw generatedError;
		expect(generatedError.mode).toBe('dark');
		expect(generatedError.limitingMiss?.background).toBe('color.surface.raised');
		expect(themeError({ base, raised: { dark: base.dark } })).toBeNull();
	});
});

describe('normalizeTheme resolves source colours once onto the foundation', () => {
	it('carries generator colours as Oklch and backdrop as CSS text, with defaults applied', () => {
		const foundation = normalizeTheme({
			color: { accent: '#3b82f6' },
			name: 'resolved-once',
			typography: testTypography,
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
		const foundation = normalizeTheme({
			color: { accent: '#3b82f6' },
			name: 'precision',
			typography: testTypography,
		});
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

describe('surface input contract', () => {
	it('accepts exactly the three surface roles', () => {
		expectTypeOf<keyof NonNullable<ThemeInput['color']['surface']>>().toEqualTypeOf<
			'base' | 'subdued' | 'raised'
		>();
	});
});

describe('standalone input contract', () => {
	it('does not accept an extends field', () => {
		expectTypeOf<Extract<keyof ThemeInput, 'extends'>>().toEqualTypeOf<never>();
	});
});

describe('TypeScript theme composition', () => {
	it('replaces a neutral and composes fonts and one material mode', () => {
		const input: ThemeInput = {
			...tactileTheme,
			name: 'composed',
			color: { ...tactileTheme.color, neutral: paperTheme.color.neutral },
			typography: {
				...tactileTheme.typography,
				fonts: { ...tactileTheme.typography.fonts, display: loraFont },
			},
			controlFinish: {
				...tactileTheme.controlFinish,
				dark: { ...tactileTheme.controlFinish?.dark, resting: 'none' },
			},
		};
		const foundation = normalizeTheme(input);
		expect(foundation.dark.color.neutral).toEqual(normalizeTheme(paperTheme).dark.color.neutral);
		expect(foundation.typography.fonts.display).toEqual(loraFont);
		expect(foundation.dark.controlFinish.resting).toBe('none');
		expect(foundation.dark.controlFinish.raised).toBe(tactileTheme.controlFinish?.dark?.raised);
		expect(foundation.light.controlFinish).toEqual(
			normalizeTheme(tactileTheme).light.controlFinish,
		);
		expect(() => defineTheme(input)).not.toThrow();
	});
});

describe('neutral composition and independent surfaces', () => {
	for (const [style, chroma, hue] of [
		['neutral', 0, 0],
		['warm', 0.01, 70],
		['cool', 0.01, 250],
	] as const) {
		it(`preserves the ${style} preset in both modes`, () => {
			const foundation = normalizeTheme({
				name: 'preset',
				color: { accent: '#3b82f6', neutral: { style } },
				typography: testTypography,
			});
			for (const [mode, lightness] of [
				['light', 0.985],
				['dark', 0.22],
			] as const) {
				expect(foundation[mode].color.neutral).toEqual(
					gamutMapOklch({ l: lightness, c: chroma, h: hue }),
				);
			}
		});
	}

	it('replaces the entire neutral choice through ordinary composition', () => {
		const original: ThemeInput = {
			name: 'composed',
			color: { accent: '#3b82f6', neutral: { style: 'warm' } },
			typography: testTypography,
		};
		const composed: ThemeInput = {
			...original,
			color: { ...original.color, neutral: { light: '#ffffff', dark: '#222222' } },
		};
		expect(normalizeTheme(composed).light.color.neutral).toEqual(
			gamutMapOklch(parseColor('#ffffff')),
		);
		// @ts-expect-error A style and mode colours cannot be combined.
		const mixed: ThemeInput['color']['neutral'] = { style: 'warm', light: '#fff' };
		expect(mixed).toBeDefined();
	});

	it('derives missing sides from their own base even when the other surfaces are authored', () => {
		const input: ThemeInput = {
			name: 'independent',
			color: {
				accent: '#3b82f6',
				neutral: { style: 'warm' },
				surface: {
					base: { light: 'oklch(0.98 0.01 250)', dark: 'oklch(0.22 0.01 250)' },
					subdued: { light: 'oklch(0.96 0.01 120)' },
					raised: { dark: 'oklch(0.29 0.01 120)' },
				},
			},
			typography: testTypography,
		};
		const foundation = normalizeTheme(input);
		const { diagnostics } = compileTheme(foundation);
		expect(foundation.light.color.neutral.h).toBe(70);
		expect(diagnostics.light.surfaces.subdued).toEqual(
			gamutMapOklch(parseColor('oklch(0.96 0.01 120)')),
		);
		expect(diagnostics.dark.surfaces.raised).toEqual(
			gamutMapOklch(parseColor('oklch(0.29 0.01 120)')),
		);
		expect(diagnostics.light.surfaces.raised.h).toBeCloseTo(250);
		expect(diagnostics.dark.surfaces.subdued.h).toBeCloseTo(250);
		expect(diagnostics.light.surfaces.raised.l).toBeCloseTo(0.995);
		expect(diagnostics.dark.surfaces.subdued.l).toBeCloseTo(0.19);
	});
});
