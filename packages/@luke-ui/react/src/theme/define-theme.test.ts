import { describe, expect, it } from 'vite-plus/test';
import { compileTheme } from './build-theme.js';
import { gamutMapOklch, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import { defaultBackdrop, defaultDepth, defineTheme, normalizeTheme } from './define-theme.js';
import { defaultSourceColors } from './foundation.js';
import { paperTheme } from './foundations/paper.js';
import { tactileTheme } from './foundations/tactile.js';
import { FAMILY_RUNG } from './scale.js';

/**
 * Splits a generated stylesheet into its five rule blocks: identity, base light, media-query dark,
 * explicit light, and explicit dark.
 */
function splitBlocks(css: string) {
	const blocks = css.split('\n\n').filter((block) => block.trim() !== '');
	if (blocks.length !== 5) throw new Error(`expected 5 rule blocks, found ${blocks.length}`);
	const [identity, baseLight, mediaDark, explicitLight, explicitDark] = blocks;
	if (
		identity === undefined ||
		baseLight === undefined ||
		mediaDark === undefined ||
		explicitLight === undefined ||
		explicitDark === undefined
	) {
		throw new Error('expected every generated theme rule block to be defined');
	}
	return { baseLight, explicitDark, explicitLight, identity, mediaDark };
}

function extractValue(block: string, varName: string): string {
	const match = new RegExp(`${varName}: ([^;]+);`).exec(block);
	if (match === null || match[1] === undefined) throw new Error(`missing ${varName} in block`);
	return match[1];
}

const ACCENT_SOLID = '--luke-color-background-accent-solid-rest';

describe('defineTheme single-value accent adaptation', () => {
	const accents = [
		'#3b82f6',
		'#ef4444',
		'#22c55e',
		'#eab308',
		'#f97316',
		'oklch(0.7 0.15 320)',
		'oklch(0.6 0.12 160)',
		'oklch(0.5 0.2 270)',
	];

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

describe('normalizeTheme resolves the source-tier `background` split from `neutral`', () => {
	it('omitted background resolves to the resolved neutral canvas anchor in both modes', () => {
		const foundation = normalizeTheme({
			color: {
				accent: '#3b82f6',
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'background-omitted',
		});
		expect(foundation.light.color.background).toBe(foundation.light.color.neutral);
		expect(foundation.dark.color.background).toBe(foundation.dark.color.neutral);
	});

	it('omitted background also coincides with a curated neutralStyle', () => {
		const foundation = normalizeTheme({
			color: { accent: '#3b82f6', neutralStyle: 'warm' },
			name: 'background-omitted-style',
		});
		expect(foundation.light.color.background).toBe(foundation.light.color.neutral);
		expect(foundation.dark.color.background).toBe(foundation.dark.color.neutral);
	});

	it('an explicit per-mode background wins over the neutral canvas anchor', () => {
		const foundation = normalizeTheme({
			color: {
				accent: '#3b82f6',
				background: { dark: 'oklch(0.18 0.01 210)', light: 'oklch(0.99 0.002 210)' },
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'background-explicit',
		});
		expect(foundation.light.color.background).toEqual(
			gamutMapOklch(parseColor('oklch(0.99 0.002 210)')),
		);
		expect(foundation.dark.color.background).toEqual(
			gamutMapOklch(parseColor('oklch(0.18 0.01 210)')),
		);
		// Different from the neutral canvas anchor: the split actually took effect.
		expect(foundation.light.color.background).not.toBe(foundation.light.color.neutral);
		expect(foundation.dark.color.background).not.toBe(foundation.dark.color.neutral);
	});

	it('a single-mode background is adapted to the opposite mode canvas lightness, not copied verbatim', () => {
		const foundation = normalizeTheme({
			color: {
				accent: '#3b82f6',
				background: { light: 'oklch(0.4 0.05 30)' },
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'background-single-mode',
		});
		// Light keeps the authored value verbatim.
		expect(foundation.light.color.background).toEqual(
			gamutMapOklch(parseColor('oklch(0.4 0.05 30)')),
		);
		// Dark is adapted from light: same hue and chroma, but the dark canvas lightness (~0.22), not
		// the light source's lightness (0.4) and not a raw copy of the light colour.
		const adaptedDark = foundation.dark.color.background;
		expect(adaptedDark.h).toBeCloseTo(30, 0);
		expect(adaptedDark.c).toBeCloseTo(0.05, 2);
		expect(adaptedDark.l).toBeCloseTo(0.22, 2);
		expect(foundation.dark.color.background).not.toBe(foundation.light.color.background);
		// And it still differs from the resolved dark neutral canvas anchor (background is split).
		expect(foundation.dark.color.background).not.toBe(foundation.dark.color.neutral);
	});

	it('a single-value background string adapts independently per mode, mirroring single-value neutral', () => {
		const foundation = normalizeTheme({
			color: { accent: '#3b82f6', background: 'oklch(0.5 0.03 140)' },
			name: 'background-single-value',
		});
		const light = foundation.light.color.background;
		const dark = foundation.dark.color.background;
		expect(light.h).toBeCloseTo(140, 0);
		expect(dark.h).toBeCloseTo(140, 0);
		expect(light.l).toBeCloseTo(0.985, 2);
		expect(dark.l).toBeCloseTo(0.22, 2);
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
		expect(typeof light.backdrop).toBe('string');
	});

	it('keeps the adapted accent hue without a format-parse round trip', () => {
		const source = gamutMapOklch(parseColor('#3b82f6'));
		const foundation = normalizeTheme({ color: { accent: '#3b82f6' }, name: 'precision' });
		expect(foundation.light.color.accent.h).toBe(source.h);
		expect(foundation.dark.color.accent.h).toBe(source.h);
	});
});

/** Extracts the set of unique `--luke-*` variable names declared in a stylesheet. */
function emittedVarNames(css: string): Set<string> {
	return new Set([...css.matchAll(/(--luke-[a-z0-9-]+):/g)].map((match) => match[1] ?? ''));
}

describe('defineTheme emits the full contract for the bundled themes', () => {
	const contractNames = flattenThemeContract().map(([, varName]) => varName);

	for (const [name, input] of [
		['tactile', tactileTheme],
		['paper', paperTheme],
	] as const) {
		const css = defineTheme(input);
		const emitted = emittedVarNames(css);

		it(`${name} emits exactly the contract variables, including overlay backdrop and disabled text`, () => {
			// Derived from the contract, not hardcoded: `contract.test.ts` already asserts the typed
			// `vars` tree has exactly as many leaves as `flattenThemeContract()`, so this only needs to
			// check that a bundled theme's emitted CSS matches that same list, not restate its length.
			expect(emitted.size).toBe(contractNames.length);
			expect([...emitted].sort()).toEqual([...contractNames].sort());
			expect(emitted.has('--luke-color-overlay-backdrop')).toBe(true);
			expect(emitted.has('--luke-color-overlay-hover')).toBe(false);
			expect(emitted.has('--luke-color-overlay-pressed')).toBe(false);
			expect(emitted.has('--luke-color-overlay-tint')).toBe(false);
			expect(emitted.has('--luke-color-scrim')).toBe(false);
			expect(emitted.has('--luke-color-text-disabled')).toBe(true);
		});

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
