import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import { contrastRatio, gamutMapOklch, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import { defaultDepth, defineTheme, normalizeTheme } from './define-theme.js';
import { paperTheme, tactileTheme } from './foundations.js';

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

const ACCENT_SOLID = '--luke-color-intent-accent-surface-solid';
const SURFACE_VAR_NAMES = [
	'--luke-color-surface-canvas',
	'--luke-color-surface-recessed',
	'--luke-color-surface-floating',
	'--luke-color-surface-overlay',
];

describe('defineTheme colour-only authoring', () => {
	it('builds a theme from just an accent and a neutral character, accessible in both modes', () => {
		const css = defineTheme({
			color: { accent: '#3b82f6', neutralStyle: 'cool' },
			name: 'colour-only',
		});
		const blocks = splitBlocks(css);
		for (const block of [blocks.baseLight, blocks.mediaDark]) {
			const textPrimary = parseColor(extractValue(block, '--luke-color-text-primary'));
			const borderControl = parseColor(extractValue(block, '--luke-color-border-control'));
			const canvas = parseColor(extractValue(block, '--luke-color-surface-canvas'));
			for (const varName of SURFACE_VAR_NAMES) {
				const surface = parseColor(extractValue(block, varName));
				expect(contrastRatio(textPrimary, surface)).toBeGreaterThanOrEqual(4.5);
			}
			// v2 borders map to the Radix-style scale step 7: a subtle separator that sits below the old
			// bespoke solver's 3:1 gate but stays visibly distinct from the canvas.
			const borderContrast = contrastRatio(borderControl, canvas);
			expect(borderContrast).toBeGreaterThan(1.2);
			expect(borderContrast).toBeLessThan(3);
		}
	});
});

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

	it('defaults the omitted dark side of a partial colour without bleeding the light override', () => {
		const infoVarNames = [
			'--luke-color-intent-info-text',
			'--luke-color-intent-info-border',
			'--luke-color-intent-info-surface-subtle',
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
		const overriddenLight = infoVarNames.map((varName) =>
			extractValue(overridden.baseLight, varName),
		);
		const defaultLight = infoVarNames.map((varName) => extractValue(allDefault.baseLight, varName));
		expect(overriddenLight).not.toEqual(defaultLight);
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
		expect(foundation.light.color.background).toBe('oklch(0.99 0.002 210)');
		expect(foundation.dark.color.background).toBe('oklch(0.18 0.01 210)');
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
		expect(foundation.light.color.background).toBe('oklch(0.4 0.05 30)');
		// Dark is adapted from light: same hue and chroma, but the dark canvas lightness (~0.22), not
		// the light source's lightness (0.4) and not a raw copy of the light string.
		const adaptedDark = parseColor(foundation.dark.color.background);
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
		const light = parseColor(foundation.light.color.background);
		const dark = parseColor(foundation.dark.color.background);
		expect(light.h).toBeCloseTo(140, 0);
		expect(dark.h).toBeCloseTo(140, 0);
		expect(light.l).toBeCloseTo(0.985, 2);
		expect(dark.l).toBeCloseTo(0.22, 2);
	});
});

/** The 25 leaves the 128-leaf flip removes, by stable `--luke-*` variable name. */
const REMOVED_VAR_NAMES = [
	'--luke-color-surface-resting',
	'--luke-color-surface-disabled',
	'--luke-color-border-disabled',
	...['info', 'success', 'warning'].flatMap((intent) =>
		[
			'surface-subtle-hover',
			'surface-subtle-pressed',
			'surface-solid',
			'surface-solid-hover',
			'surface-solid-pressed',
			'on-solid',
		].map((leaf) => `--luke-color-intent-${intent}-${leaf}`),
	),
	'--luke-motion-duration-medium',
	'--luke-motion-duration-slow',
	'--luke-motion-duration-ambient',
	'--luke-motion-easing-enter',
];

/** Extracts the set of unique `--luke-*` variable names declared in a stylesheet. */
function emittedVarNames(css: string): Set<string> {
	return new Set([...css.matchAll(/(--luke-[a-z0-9-]+):/g)].map((match) => match[1] ?? ''));
}

describe('the reduced 128-leaf contract', () => {
	it('flattens to exactly 128 leaves with scrim added and the 25 removed leaves absent', () => {
		const names = flattenThemeContract().map(([, varName]) => varName);
		expect(names).toHaveLength(128);
		expect(names).toContain('--luke-color-scrim');
		// text.disabled kept its stable CSS variable across the rename from color.textDisabled.
		expect(names).toContain('--luke-color-text-disabled');
		for (const removed of REMOVED_VAR_NAMES) expect(names).not.toContain(removed);
	});
});

describe('defineTheme emits the reduced contract for the bundled themes', () => {
	const contractNames = flattenThemeContract().map(([, varName]) => varName);

	for (const [name, input] of [
		['tactile', tactileTheme],
		['paper', paperTheme],
	] as const) {
		const css = defineTheme(input);
		const emitted = emittedVarNames(css);

		it(`${name} emits exactly the 128 contract variables, including scrim and disabled text`, () => {
			expect(emitted.size).toBe(128);
			expect([...emitted].sort()).toEqual([...contractNames].sort());
			expect(emitted.has('--luke-color-scrim')).toBe(true);
			expect(emitted.has('--luke-color-text-disabled')).toBe(true);
		});

		it(`${name} drops every one of the 25 removed leaves`, () => {
			for (const removed of REMOVED_VAR_NAMES) expect(emitted.has(removed)).toBe(false);
		});

		it(`${name} keeps feedback intents static — soft kit only, no solid or state variables`, () => {
			for (const intent of ['info', 'success', 'warning']) {
				expect(css).not.toContain(`--luke-color-intent-${intent}-surface-solid`);
				expect(css).not.toContain(`--luke-color-intent-${intent}-surface-subtle-hover`);
				expect(css).not.toContain(`--luke-color-intent-${intent}-surface-subtle-pressed`);
				expect(css).not.toContain(`--luke-color-intent-${intent}-on-solid`);
				expect(css).toContain(`--luke-color-intent-${intent}-surface-subtle:`);
				expect(css).toContain(`--luke-color-intent-${intent}-border:`);
				expect(css).toContain(`--luke-color-intent-${intent}-text:`);
			}
		});
	}

	it('emits the expected v2 token values for known Tactile leaves', () => {
		const css = defineTheme(tactileTheme);
		for (const declaration of [
			// The canvas IS the resolved background (Tactile's light neutral), unchanged from pre-v2.
			'--luke-color-surface-canvas: oklch(0.985 0 0);',
			// Global text/skeleton now alias the neutral family: primary = neutral 12 (light) / dark 12,
			// disabled = neutral 8, the neutral subtle surface = neutral 3.
			'--luke-color-text-primary: oklch(0.3 0 0);',
			'--luke-color-text-disabled: oklch(0.5 0.0117 210);',
			'--luke-color-intent-neutral-surface-subtle: oklch(0.955 0 0);',
			// The danger solid stays the authored default source (danger step 9 lands on it verbatim).
			'--luke-color-intent-danger-surface-solid: oklch(0.52 0.18 27);',
		]) {
			expect(css).toContain(declaration);
		}
		// Scrim is passed through: black at the mode-aware default alpha.
		expect(css).toContain('--luke-color-scrim: oklch(0 0 0 / 0.2);');
		expect(css).toContain('--luke-color-scrim: oklch(0 0 0 / 0.4);');
	});
});

describe('the combobox tray scrim adopts the scrim token', () => {
	it('replaces the hardcoded rgb(0 0 0 / 20%) literal with vars.color.scrim', async () => {
		const source = await readFile(new URL('../recipes/combobox.css.ts', import.meta.url), 'utf8');
		expect(source).not.toContain('rgb(0 0 0 / 20%)');
		expect(source).toContain('vars.color.scrim');
	});
});
