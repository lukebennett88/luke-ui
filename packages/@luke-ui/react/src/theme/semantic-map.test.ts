import { describe, expect, it } from 'vite-plus/test';
import type { Oklch } from './color.js';
import { formatOklch, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import { generateSurfaces } from './elevation.js';
import { defaultSourceColors } from './foundation.js';
import type { FamilyRole, ScaleFamily } from './scale.js';
import {
	FAMILY_RUNG,
	generateFamily,
	highContrastText,
	INTERACTION_HOVER_STRENGTH,
	INTERACTION_PRESSED_STRENGTH,
	mixInteractionState,
} from './scale.js';
import { mapSemanticColors } from './semantic-map.js';

type ColorMode = 'light' | 'dark';

const BACKGROUND: Record<ColorMode, Oklch> = {
	dark: parseColor('oklch(0.18 0.004 250)'),
	light: parseColor('oklch(0.99 0.003 250)'),
};

const MODES: ReadonlyArray<ColorMode> = ['light', 'dark'];

// A stand-in for `control-border.ts`'s `solveControlBorder` output: mapSemanticColors only
// aliases this through, so any distinct Oklch value proves the passthrough without re-testing
// the solver itself.
const CONTROL_BORDER: Record<ColorMode, Oklch> = {
	dark: parseColor('oklch(0.62 0.006 250)'),
	light: parseColor('oklch(0.38 0.006 250)'),
};

const FOCUS = parseColor('oklch(0.6 0.2 260)');

// A representative source per role and mode. `info`/`success`/`warning`/`danger` reuse Luke UI's
// curated defaults, which are chosen to clear the on-solid gate on near-white/near-black canvases;
// `accent` reuses the vibrant blue scale.test.ts exercises without adaptation in either mode;
// `neutral` mirrors the canvas so the neutral solid search stays in its curated band.
const SOURCE: Record<ColorMode, Record<FamilyRole, string>> = {
	dark: {
		accent: '#0090ff',
		danger: defaultSourceColors.dark.danger,
		info: defaultSourceColors.dark.info,
		neutral: 'oklch(0.18 0.004 250)',
		success: defaultSourceColors.dark.success,
		warning: defaultSourceColors.dark.warning,
	},
	light: {
		accent: '#0090ff',
		danger: defaultSourceColors.light.danger,
		info: defaultSourceColors.light.info,
		neutral: 'oklch(0.99 0.003 250)',
		success: defaultSourceColors.light.success,
		warning: defaultSourceColors.light.warning,
	},
};

function buildFamilies(mode: ColorMode, background: Oklch): Record<FamilyRole, ScaleFamily> {
	const textPrimary = highContrastText(parseColor(SOURCE[mode].neutral), mode);
	const family = (role: FamilyRole) => {
		return generateFamily({
			background,
			interactionSource: textPrimary,
			mode,
			role,
			source: parseColor(SOURCE[mode][role]),
		});
	};
	return {
		accent: family('accent'),
		danger: family('danger'),
		info: family('info'),
		neutral: family('neutral'),
		success: family('success'),
		warning: family('warning'),
	};
}

describe('mapSemanticColors', () => {
	describe('correctness', () => {
		for (const mode of MODES) {
			it(`resolves every leaf to its mapped family step / surface / passthrough (${mode})`, () => {
				const background = BACKGROUND[mode];
				const families = buildFamilies(mode, background);
				const surfaces = generateSurfaces({ background, mode });
				const backdrop = 'oklch(0 0 0 / 0.45)';
				const controlBorder = CONTROL_BORDER[mode];

				const result = mapSemanticColors({
					backdrop,
					controlBorder,
					families,
					focus: FOCUS,
					surfaces,
				});

				// Surfaces: canvas IS the background.
				expect(result['color.surface.canvas']).toBe(formatOklch(surfaces.canvas));
				expect(result['color.surface.recessed']).toBe(formatOklch(surfaces.recessed));
				expect(result['color.surface.floating']).toBe(formatOklch(surfaces.floating));
				expect(result['color.surface.overlay']).toBe(formatOklch(surfaces.overlay));
				expect(result['color.overlay.backdrop']).toBe(backdrop);
				expect(result['color.loadingSkeleton']).toBe(
					formatOklch(families.neutral[FAMILY_RUNG.muted]),
				);

				// Global text and borders use the neutral family. `border.control` is a solved
				// contrast boundary, not a scale-step alias, so it aliases the passed-through value.
				expect(result['color.text.primary']).toBe(
					formatOklch(families.neutral[FAMILY_RUNG.textPrimary]),
				);
				expect(result['color.text.secondary']).toBe(
					formatOklch(families.neutral[FAMILY_RUNG.foreground]),
				);
				expect(result['color.text.disabled']).toBe(
					formatOklch(families.neutral[FAMILY_RUNG.muted]),
				);
				expect(result['color.border.decorative']).toBe(
					formatOklch(families.neutral[FAMILY_RUNG.decorative]),
				);
				expect(result['color.border.control']).toBe(formatOklch(controlBorder));
				expect(result['color.border.focus']).toBe(formatOklch(FOCUS));

				// The shared contract: identical rest / hover / pressed mapping for every semantic role.
				for (const role of SEMANTIC_ROLES) {
					const family = families[role];
					const textPrimary = families.neutral[FAMILY_RUNG.textPrimary];
					const subtle = family[FAMILY_RUNG.subtle];
					const solid = family[FAMILY_RUNG.solid];
					const foreground = family[FAMILY_RUNG.foreground];
					expect(result[`color.background.${role}.subtle.rest`]).toBe(formatOklch(subtle));
					expect(result[`color.background.${role}.subtle.hover`]).toBe(
						formatOklch(mixInteractionState(subtle, textPrimary, INTERACTION_HOVER_STRENGTH)),
					);
					expect(result[`color.background.${role}.subtle.pressed`]).toBe(
						formatOklch(mixInteractionState(subtle, textPrimary, INTERACTION_PRESSED_STRENGTH)),
					);
					expect(result[`color.background.${role}.solid.rest`]).toBe(formatOklch(solid));
					expect(result[`color.background.${role}.solid.hover`]).toBe(
						formatOklch(mixInteractionState(solid, textPrimary, INTERACTION_HOVER_STRENGTH)),
					);
					expect(result[`color.background.${role}.solid.pressed`]).toBe(
						formatOklch(mixInteractionState(solid, textPrimary, INTERACTION_PRESSED_STRENGTH)),
					);
					expect(result[`color.foreground.${role}.rest`]).toBe(formatOklch(foreground));
					expect(result[`color.foreground.${role}.hover`]).toBe(
						formatOklch(mixInteractionState(foreground, textPrimary, INTERACTION_HOVER_STRENGTH)),
					);
					expect(result[`color.foreground.${role}.pressed`]).toBe(
						formatOklch(mixInteractionState(foreground, textPrimary, INTERACTION_PRESSED_STRENGTH)),
					);
					expect(result[`color.foreground.${role}.onSolid`]).toBe(formatOklch(family.contrast));
					expect(result[`color.border.${role}`]).toBe(formatOklch(family[FAMILY_RUNG.border]));
				}
			});
		}
	});

	describe('completeness', () => {
		// Every `color.*` leaf, including the passed-through `color.overlay.backdrop`.
		const colourPaths = flattenThemeContract()
			.map(([path]) => path)
			.filter((path) => path.startsWith('color.'));

		for (const mode of MODES) {
			it(`assigns every colour leaf exactly once, and nothing else (${mode})`, () => {
				const background = BACKGROUND[mode];
				const families = buildFamilies(mode, background);
				const surfaces = generateSurfaces({ background, mode });

				const result = mapSemanticColors({
					backdrop: 'oklch(0 0 0 / 0.45)',
					controlBorder: CONTROL_BORDER[mode],
					families,
					focus: FOCUS,
					surfaces,
				});

				// Comparing the whole key set both ways is what makes this a completeness check: a missing
				// leaf leaves `buildTheme` emitting an undefined variable, and an extra key is a path that
				// is outside the contract and so is silently dropped.
				expect(Object.keys(result).sort()).toEqual([...colourPaths].sort());
			});
		}
	});

	describe('backdrop', () => {
		it('passes the authored backdrop value through verbatim, alpha channel included', () => {
			const background = BACKGROUND.light;
			const families = buildFamilies('light', background);
			const surfaces = generateSurfaces({ background, mode: 'light' });
			const backdrop = 'oklch(0 0 0 / 0.5)';

			const result = mapSemanticColors({
				backdrop,
				controlBorder: CONTROL_BORDER.light,
				families,
				focus: FOCUS,
				surfaces,
			});

			expect(result['color.overlay.backdrop']).toBe(backdrop);
		});
	});
});
