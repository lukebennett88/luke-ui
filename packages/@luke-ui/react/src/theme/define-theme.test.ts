import { describe, expect, it } from 'vite-plus/test';
import { buildTheme } from './build-theme.js';
import { contrastRatio, gamutMapOklch, parseColor } from './color.js';
import { defaultDepth, defineTheme } from './define-theme.js';
import type { ThemeInput } from './define-theme.js';
import { defaultSourceColors } from './foundation.js';
import { paperFoundation, tactileFoundation } from './foundations.js';

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
	'--luke-color-surface-resting',
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
			expect(contrastRatio(borderControl, canvas)).toBeGreaterThanOrEqual(3);
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

describe('defineTheme parity with the bundled foundations', () => {
	const tactileInput: ThemeInput = {
		actionControlFinish: {
			dark: tactileFoundation.dark.actionControlFinish,
			light: tactileFoundation.light.actionControlFinish,
		},
		color: {
			accent: {
				dark: tactileFoundation.dark.color.accent,
				light: tactileFoundation.light.color.accent,
			},
			neutral: {
				dark: tactileFoundation.dark.color.neutral,
				light: tactileFoundation.light.color.neutral,
			},
		},
		depth: { dark: tactileFoundation.dark.depth, light: tactileFoundation.light.depth },
		name: 'tactile',
	};

	const paperInput: ThemeInput = {
		actionControlFinish: {
			dark: paperFoundation.dark.actionControlFinish,
			light: paperFoundation.light.actionControlFinish,
		},
		color: {
			accent: {
				dark: paperFoundation.dark.color.accent,
				light: paperFoundation.light.color.accent,
			},
			// Paper authors feedback colours in light only; the omitted dark sides default.
			danger: { light: paperFoundation.light.color.danger },
			info: { light: paperFoundation.light.color.info },
			neutral: {
				dark: paperFoundation.dark.color.neutral,
				light: paperFoundation.light.color.neutral,
			},
			success: { light: paperFoundation.light.color.success },
			warning: { light: paperFoundation.light.color.warning },
		},
		depth: { dark: paperFoundation.dark.depth, light: paperFoundation.light.depth },
		name: 'paper',
		radius: { control: 4 },
	};

	it('reproduces Tactile byte-for-byte', () => {
		expect(defineTheme(tactileInput)).toBe(buildTheme(tactileFoundation));
	});

	it('reproduces Paper byte-for-byte', () => {
		expect(defineTheme(paperInput)).toBe(buildTheme(paperFoundation));
	});

	it('resolves the omitted dark feedback sides to the curated defaults', () => {
		// Sanity-check the parity claim: Paper's dark feedback intents come from defaultSourceColors.
		expect(paperFoundation.dark.color.info).toBeUndefined();
		expect(defaultSourceColors.dark.info).toMatch(/^oklch\(/);
	});
});
