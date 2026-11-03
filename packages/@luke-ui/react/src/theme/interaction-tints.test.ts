import { describe, expect, it } from 'vite-plus/test';
import { chromaticTheme } from './__fixtures__/chromatic.js';
import { contrastEdgeTheme } from './__fixtures__/contrast-edge.js';
import { paperTheme } from './__fixtures__/paper.js';
import { tactileTheme } from './__fixtures__/tactile.js';
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
import { defineTheme, normalizeTheme } from './define-theme.js';
import type { ThemeFoundation } from './foundation.js';
import { solveInteractionTints, ThemeInteractionTintError } from './interaction-tints.js';
import { INTERACTION_HOVER_STRENGTH, mixInteractionState, oklabDeltaE } from './scale.js';
import type { SemanticColorValues } from './semantic-map.js';

// Tactile with the default flat finish and shadow ladder, as the flat theme is authored.
const { controlFinish: _controlFinish, shadow: _shadow, ...tactileColours } = tactileTheme;
const flatFoundation = normalizeTheme({ ...tactileColours, name: 'flat-fixture' });

const FOUNDATIONS = [
	['Paper', paperFoundation],
	['Tactile', tactileFoundation],
	['flat', flatFoundation],
	['chromatic', normalizeTheme(chromaticTheme)],
	['contrastEdge', normalizeTheme(contrastEdgeTheme)],
] as const;

// Everything a state layer can sit on: the three surfaces and the six subtle fills.
const TINT_BACKGROUNDS = [
	'color.background.surface.base',
	'color.background.surface.subdued',
	'color.background.surface.raised',
	...SEMANTIC_ROLES.map((role) => `color.background.${role}.subtle` as const),
] as const;

/** The alpha at which the tint over the base surface best matches the neutral hover mix. */
function hoverTargetAlpha(colorValues: SemanticColorValues, mode: 'light' | 'dark'): number {
	const tint = mode === 'dark' ? { l: 1, c: 0, h: 0 } : { l: 0, c: 0, h: 0 };
	const base = parseColor(colorValues['color.background.surface.base']);
	const target = mixInteractionState(
		parseColor(colorValues['color.background.neutral.subtle']),
		parseColor(colorValues['color.foreground.primary']),
		INTERACTION_HOVER_STRENGTH,
	);
	let best = 0;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let step = 0; step <= 1000; step++) {
		const distance = oklabDeltaE(compositeEncodedSrgb(tint, base, step / 1000), target);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = step / 1000;
		}
	}
	return best;
}

describe('solveInteractionTints', () => {
	for (const [name, foundation] of FOUNDATIONS) {
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
				const backgrounds = TINT_BACKGROUNDS;
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
		const white = { l: 1, c: 0, h: 0 };
		const targetHoverAlpha = hoverTargetAlpha(colorValues, 'dark');
		// The margin over the raised surface needs less than the target.
		expect(tints.hoverAlpha).toBeLessThan(targetHoverAlpha);
		expect(tints.pressedAlpha).toBeGreaterThan(tints.hoverAlpha);
		const raised = parseColor(colorValues['color.background.surface.raised']);
		const danger = parseColor(colorValues['color.foreground.danger.rest']);
		const tinted = compositeEncodedSrgb(white, raised, tints.pressedAlpha);
		expect(contrastRatio(danger, tinted)).toBeGreaterThanOrEqual(TEXT_RATIO);
	});

	for (const [name, foundation] of FOUNDATIONS) {
		it(`never picks a ${name} hover above the larger of its target and the first visible alpha`, () => {
			for (const mode of ['light', 'dark'] as const) {
				const colorValues = compiledColorValues(foundation, mode);
				const tints = solveInteractionTints(mode, colorValues);
				const tint = mode === 'dark' ? { l: 1, c: 0, h: 0 } : { l: 0, c: 0, h: 0 };
				const backgrounds = TINT_BACKGROUNDS.map((path) => {
					return parseColor(colorValues[path]);
				});
				let firstVisible = 0;
				while (
					backgrounds.some((background) => {
						return (
							oklabDeltaE(background, compositeEncodedSrgb(tint, background, firstVisible)) <
							INTERACTION_HOVER_VISIBILITY + VISIBILITY_MARGIN
						);
					})
				) {
					firstVisible += 0.001;
				}
				const limit = Math.max(hoverTargetAlpha(colorValues, mode), firstVisible);
				expect(tints.hoverAlpha, `${mode} hover`).toBeLessThanOrEqual(limit + 1e-9);
			}
		});
	}

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
