import { describe, expect, it } from 'vite-plus/test';
import { paperTheme } from './__fixtures__/paper.js';
import { tactileTheme } from './__fixtures__/tactile.js';
import { splitBlocks } from './__fixtures__/theme-css.js';
import { compileTheme } from './build-theme.js';
import { compositeEncodedSrgb, contrastRatio, formatOklch, parseColor } from './color.js';
import {
	INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
	INTERACTION_HOVER_VISIBILITY,
	SEMANTIC_ROLES,
	TEXT_RATIO,
} from './contrast-policy.js';
import { controlHoverBorder, solveControlBorder } from './control-border.js';
import { defineTheme, normalizeTheme } from './define-theme.js';
import { interactionTintVarName } from './interaction-tint-vars.js';
import { solveInteractionTints, ThemeInteractionTintError } from './interaction-tints.js';
import { generateFamilyWithDiagnostics, highContrastText, oklabDeltaE } from './scale.js';
import { mapSemanticColors } from './semantic-map.js';
import { generateSurfaces } from './surfaces.js';

describe('solveInteractionTints', () => {
	for (const [name, input] of [
		['Paper', paperTheme],
		['Tactile', tactileTheme],
	] as const) {
		it(`emits a black light pair and a white dark pair for ${name}`, () => {
			const blocks = splitBlocks(compileTheme(normalizeTheme(input)).css);
			expect(blocks.baseLight).toContain(`${interactionTintVarName('hover')}: oklch(0 0 0 /`);
			expect(blocks.baseLight).toContain(`${interactionTintVarName('pressed')}: oklch(0 0 0 /`);
			expect(blocks.mediaDark).toContain(`${interactionTintVarName('hover')}: oklch(1 0 0 /`);
			expect(blocks.mediaDark).toContain(`${interactionTintVarName('pressed')}: oklch(1 0 0 /`);
		});

		it(`keeps ${name} tint visibility above the calibrated floors`, () => {
			const foundation = normalizeTheme(input);
			for (const mode of ['light', 'dark'] as const) {
				const values = modeColorValues(foundation, mode);
				const tints = solveInteractionTints(mode, values);
				const tint = mode === 'dark' ? { l: 1, c: 0, h: 0 } : { l: 0, c: 0, h: 0 };
				for (const surface of ['base', 'subdued', 'field', 'overlay'] as const) {
					const background = parseColor(values[`color.surface.${surface}`]);
					const hover = compositeEncodedSrgb(tint, background, tints.hoverAlpha);
					const pressed = compositeEncodedSrgb(tint, background, tints.pressedAlpha);
					expect(oklabDeltaE(background, hover)).toBeGreaterThan(0);
					expect(oklabDeltaE(hover, pressed)).toBeGreaterThanOrEqual(
						INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
					);
				}
				expect(tints.hoverVisibility).toBeGreaterThanOrEqual(INTERACTION_HOVER_VISIBILITY);
				expect(tints.hoverToPressedVisibility).toBeGreaterThanOrEqual(
					INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
				);
				expect(tints.pressedAlpha).toBeGreaterThan(tints.hoverAlpha);
			}
		});

		it(`keeps critical text at ${TEXT_RATIO}:1 over ${name} dark overlay with the pressed tint`, () => {
			const foundation = normalizeTheme(input);
			const colorValues = modeColorValues(foundation, 'dark');
			const tints = solveInteractionTints('dark', colorValues);
			const overlay = parseColor(colorValues['color.surface.overlay']);
			const danger = parseColor(colorValues['color.foreground.danger.rest']);
			const tinted = compositeEncodedSrgb({ l: 1, c: 0, h: 0 }, overlay, tints.pressedAlpha);
			expect(contrastRatio(danger, tinted)).toBeGreaterThanOrEqual(TEXT_RATIO);
		});
	}

	it('rejects colour values whose contrast cap collapses hover below the visibility floor', () => {
		const colorValues = { ...modeColorValues(normalizeTheme(paperTheme), 'dark') };
		const overlay = parseColor(colorValues['color.surface.overlay']);
		// Darken danger foregrounds until they barely clear AA on the untinted overlay, so any
		// useful white tint fails the contrast cap and the visibility floors reject the theme.
		for (const state of ['rest', 'hover', 'pressed'] as const) {
			const path = `color.foreground.danger.${state}` as const;
			const current = parseColor(colorValues[path]);
			let lightness = current.l;
			for (let step = 0; step < 200; step++) {
				const candidate = { ...current, l: lightness };
				if (contrastRatio(candidate, overlay) <= 4.55) break;
				lightness -= 0.001;
			}
			colorValues[path] = formatOklch({ ...current, l: lightness });
		}

		expect(() => solveInteractionTints('dark', colorValues)).toThrow(ThemeInteractionTintError);
	});

	it('rejects a custom theme whose dark overlay leaves no visible contrast-safe tint', () => {
		const theme = (lightness: number) => ({
			color: { surface: { overlay: { dark: `oklch(${lightness} 0.01 250)` } } },
			extends: paperTheme,
			name: 'contrast-edge',
		});
		expect(() => defineTheme(theme(0.32))).not.toThrow();
		expect(() => defineTheme(theme(0.33))).toThrow(ThemeInteractionTintError);
	});
});

function modeColorValues(foundation: ReturnType<typeof normalizeTheme>, mode: 'light' | 'dark') {
	const modeFoundation = foundation[mode];
	const source = modeFoundation.color;
	const base = source.surface.base;
	const textPrimary = highContrastText(source.neutral, mode);
	const families = {} as Record<
		(typeof SEMANTIC_ROLES)[number],
		ReturnType<typeof generateFamilyWithDiagnostics>['family']
	>;
	for (const role of SEMANTIC_ROLES) {
		families[role] = generateFamilyWithDiagnostics({
			background: base,
			interactionSource: textPrimary,
			mode,
			role,
			source: source[role],
		}).family;
	}
	const surfaces = generateSurfaces({ mode, surface: source.surface });
	const controlBorder = solveControlBorder({
		mode,
		neutral: families.neutral,
		surfaces: [surfaces.base, surfaces.subdued, surfaces.field, surfaces.overlay],
	});
	return mapSemanticColors({
		backdrop: modeFoundation.color.backdrop,
		controlBorder,
		controlHoverBorder: controlHoverBorder(controlBorder, mode),
		families,
		focus: source.focus,
		surfaces,
	});
}
