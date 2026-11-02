import { describe, expect, it } from 'vite-plus/test';
import { paperTheme } from './__fixtures__/paper.js';
import {
	extractValue,
	paperFoundation,
	splitBlocks,
	tactileFoundation,
} from './__fixtures__/theme-css.js';
import { compileTheme } from './build-theme.js';
import { compositeEncodedSrgb, contrastRatio, formatOklch, parseColor } from './color.js';
import { flattenThemeContract, partitionContractPairs, themeVarName } from './contract.js';
import {
	INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
	INTERACTION_HOVER_VISIBILITY,
	SEMANTIC_ROLES,
	TEXT_RATIO,
	VISIBILITY_MARGIN,
} from './contrast-policy.js';
import { defineTheme } from './define-theme.js';
import type { ThemeFoundation } from './foundation.js';
import { solveInteractionTints, ThemeInteractionTintError } from './interaction-tints.js';
import { oklabDeltaE } from './scale.js';
import type { SemanticColorValues } from './semantic-map.js';

describe('solveInteractionTints', () => {
	for (const [name, foundation] of [
		['Paper', paperFoundation],
		['Tactile', tactileFoundation],
	] as const) {
		it(`emits a black light pair and a white dark pair for ${name}`, () => {
			const blocks = splitBlocks(compileTheme(foundation).css);
			expect(blocks.baseLight).toContain(
				`${themeVarName(['interaction', 'tint', 'hover'])}: oklch(0 0 0 /`,
			);
			expect(blocks.baseLight).toContain(
				`${themeVarName(['interaction', 'tint', 'pressed'])}: oklch(0 0 0 /`,
			);
			expect(blocks.mediaDark).toContain(
				`${themeVarName(['interaction', 'tint', 'hover'])}: oklch(1 0 0 /`,
			);
			expect(blocks.mediaDark).toContain(
				`${themeVarName(['interaction', 'tint', 'pressed'])}: oklch(1 0 0 /`,
			);
		});

		it(`keeps ${name} tint visibility above the calibrated floors`, () => {
			for (const mode of ['light', 'dark'] as const) {
				const values = compiledColorValues(foundation, mode);
				const tints = solveInteractionTints(mode, values);
				const tint = mode === 'dark' ? { l: 1, c: 0, h: 0 } : { l: 0, c: 0, h: 0 };
				for (const surface of ['base', 'subdued', 'raised'] as const) {
					const background = parseColor(values[`color.background.surface.${surface}`]);
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

		it(`clears both floors, and their margin, over every surface and subtle fill for ${name}`, () => {
			for (const mode of ['light', 'dark'] as const) {
				const values = compiledColorValues(foundation, mode);
				const tints = solveInteractionTints(mode, values);
				const tint = mode === 'dark' ? { l: 1, c: 0, h: 0 } : { l: 0, c: 0, h: 0 };
				const backgrounds = [
					'color.background.surface.base',
					'color.background.surface.subdued',
					'color.background.surface.raised',
					...SEMANTIC_ROLES.map((role) => `color.background.${role}.subtle`),
				] as const;
				for (const path of backgrounds) {
					const background = parseColor(values[path as keyof SemanticColorValues]);
					const hover = compositeEncodedSrgb(tint, background, tints.hoverAlpha);
					const pressed = compositeEncodedSrgb(tint, background, tints.pressedAlpha);
					expect(
						oklabDeltaE(background, hover),
						`${mode} ${path} rest to hover`,
					).toBeGreaterThanOrEqual(INTERACTION_HOVER_VISIBILITY + VISIBILITY_MARGIN);
					expect(
						oklabDeltaE(hover, pressed),
						`${mode} ${path} hover to pressed`,
					).toBeGreaterThanOrEqual(INTERACTION_HOVER_TO_PRESSED_VISIBILITY + VISIBILITY_MARGIN);
				}
				expect(tints.hoverVisibility).toBeGreaterThanOrEqual(INTERACTION_HOVER_VISIBILITY);
			}
		});

		it(`keeps danger text at ${TEXT_RATIO}:1 over ${name} dark raised with the pressed tint`, () => {
			const colorValues = compiledColorValues(foundation, 'dark');
			const tints = solveInteractionTints('dark', colorValues);
			const raised = parseColor(colorValues['color.background.surface.raised']);
			const danger = parseColor(colorValues['color.foreground.danger.rest']);
			const tinted = compositeEncodedSrgb({ l: 1, c: 0, h: 0 }, raised, tints.pressedAlpha);
			expect(contrastRatio(danger, tinted)).toBeGreaterThanOrEqual(TEXT_RATIO);
		});
	}

	it('rejects colour values whose contrast cap collapses hover below the visibility floor', () => {
		const colorValues = { ...compiledColorValues(paperFoundation, 'dark') };
		const raised = parseColor(colorValues['color.background.surface.raised']);
		// Darken danger foregrounds until they barely clear AA on the untinted raised surface, so any
		// useful white tint fails the contrast cap and the visibility floors reject the theme.
		for (const state of ['rest', 'hover', 'pressed'] as const) {
			const path = `color.foreground.danger.${state}` as const;
			const current = parseColor(colorValues[path]);
			let lightness = current.l;
			for (let step = 0; step < 200; step++) {
				const candidate = { ...current, l: lightness };
				if (contrastRatio(candidate, raised) <= 4.55) break;
				lightness -= 0.001;
			}
			colorValues[path] = formatOklch({ ...current, l: lightness });
		}

		expect(() => solveInteractionTints('dark', colorValues)).toThrow(ThemeInteractionTintError);
	});

	it('finds a feasible tint pair when proportional scaling would miss the visibility floor', () => {
		const theme = (lightness: number) => ({
			...paperTheme,
			color: {
				...paperTheme.color,
				surface: { ...paperTheme.color.surface, raised: { dark: `oklch(${lightness} 0.01 250)` } },
			},
			name: 'contrast-edge',
		});
		expect(() => defineTheme(theme(0.32))).not.toThrow();
		expect(() => defineTheme(theme(0.33))).not.toThrow();

		const colorValues = compiledColorValues(paperFoundation, 'dark');
		colorValues['color.background.surface.raised'] = 'oklch(0.33 0.01 250)';
		const tints = solveInteractionTints('dark', colorValues);
		expect(tints.hoverAlpha).toBeLessThan(0.078);
		expect(tints.hoverToPressedVisibility).toBeGreaterThanOrEqual(
			INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
		);
	});

	it('makes room for the margin by lowering hover, and keeps pressed under its contrast cap', () => {
		const colorValues = compiledColorValues(tactileFoundation, 'dark');
		const tints = solveInteractionTints('dark', colorValues);
		// Tactile dark's hover target is 0.074. The margin over the raised surface needs less.
		expect(tints.hoverAlpha).toBeLessThan(0.074);
		expect(tints.pressedAlpha).toBeGreaterThan(tints.hoverAlpha);
		const raised = parseColor(colorValues['color.background.surface.raised']);
		const danger = parseColor(colorValues['color.foreground.danger.rest']);
		const tinted = compositeEncodedSrgb({ l: 1, c: 0, h: 0 }, raised, tints.pressedAlpha);
		expect(contrastRatio(danger, tinted)).toBeGreaterThanOrEqual(TEXT_RATIO);
	});

	it('raises a target pressed tint that falls below the minimum visible pair', () => {
		const colorValues = compiledColorValues(paperFoundation, 'dark');
		const tints = solveInteractionTints('dark', colorValues);
		expect(tints.pressedAlpha).toBeGreaterThan(0);
		expect(tints.hoverToPressedVisibility).toBeGreaterThanOrEqual(
			INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
		);
	});

	it('rejects colour values whose resting text already fails contrast', () => {
		const colorValues = compiledColorValues(paperFoundation, 'dark');
		colorValues['color.background.surface.raised'] = colorValues['color.foreground.primary'];
		expect(() => solveInteractionTints('dark', colorValues)).toThrow(ThemeInteractionTintError);
	});
});

function colorModePairs(): Array<[keyof SemanticColorValues, string]> {
	const { modePairs } = partitionContractPairs(flattenThemeContract());
	return modePairs.filter(([path]) => path.startsWith('color.')) as Array<
		[keyof SemanticColorValues, string]
	>;
}

/** The colour values `compileTheme` emits for `mode`, read back from its stylesheet. */
function compiledColorValues(
	foundation: ThemeFoundation,
	mode: 'light' | 'dark',
): SemanticColorValues {
	const blocks = splitBlocks(compileTheme(foundation).css);
	const block = mode === 'light' ? blocks.baseLight : blocks.mediaDark;
	const values = {} as SemanticColorValues;
	for (const [path, varName] of colorModePairs()) {
		values[path] = extractValue(block, varName);
	}
	return values;
}
