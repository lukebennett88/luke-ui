import { describe, expect, it } from 'vite-plus/test';
import type { Oklch } from './color.js';
import { formatOklch, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import { generateSurfaces } from './elevation.js';
import { defaultSourceColors } from './foundation.js';
import type { FamilyRole, ScaleFamily } from './scale.js';
import { generateFamily } from './scale.js';
import {
	mapSemanticColors,
	OVERLAY_HOVER_PERCENT,
	OVERLAY_PRESSED_PERCENT,
} from './semantic-map.js';

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
	const family = (role: FamilyRole) => {
		return generateFamily({ background, mode, role, source: parseColor(SOURCE[mode][role]) });
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
				const focus = parseColor('oklch(0.6 0.2 260)');
				const controlBorder = CONTROL_BORDER[mode];

				const result = mapSemanticColors({
					backdrop,
					controlBorder,
					families,
					focus,
					surfaces,
				});

				// Surfaces: canvas IS the background.
				expect(result['color.surface.canvas']).toBe(formatOklch(surfaces.canvas));
				expect(result['color.surface.recessed']).toBe(formatOklch(surfaces.recessed));
				expect(result['color.surface.floating']).toBe(formatOklch(surfaces.floating));
				expect(result['color.surface.overlay']).toBe(formatOklch(surfaces.overlay));
				expect(result['color.overlay.backdrop']).toBe(backdrop);
				expect(result['color.overlay.hover']).toBe(
					`color-mix(in oklab, ${formatOklch(families.neutral[12])} ${OVERLAY_HOVER_PERCENT}%, transparent)`,
				);
				expect(result['color.overlay.pressed']).toBe(
					`color-mix(in oklab, ${formatOklch(families.neutral[12])} ${OVERLAY_PRESSED_PERCENT}%, transparent)`,
				);
				expect(result['color.overlay.tint']).toBeUndefined();
				expect(result['color.loadingSkeleton']).toBe(formatOklch(families.neutral[8]));

				// Global text and borders use the neutral family. `border.control` is a solved
				// contrast boundary, not a scale-step alias, so it aliases the passed-through value.
				expect(result['color.text.primary']).toBe(formatOklch(families.neutral[12]));
				expect(result['color.text.secondary']).toBe(formatOklch(families.neutral[11]));
				expect(result['color.text.disabled']).toBe(formatOklch(families.neutral[8]));
				expect(result['color.border.decorative']).toBe(formatOklch(families.neutral[6]));
				expect(result['color.border.control']).toBe(formatOklch(controlBorder));
				expect(result['color.border.focus']).toBe(formatOklch(focus));

				// The shared contract: identical steps for all six roles, keyed to the role's own family.
				for (const role of SEMANTIC_ROLES) {
					const family = families[role];
					expect(result[`color.background.${role}.subtle`]).toBe(formatOklch(family[3]));
					expect(result[`color.background.${role}.solid`]).toBe(formatOklch(family[9]));
					expect(result[`color.background.${role}.subtle.hover`]).toBeUndefined();
					expect(result[`color.background.${role}.solid.hover`]).toBeUndefined();
					expect(result[`color.foreground.${role}.rest`]).toBe(formatOklch(family[11]));
					expect(result[`color.foreground.${role}.hover`]).toBe(formatOklch(family[12]));
					expect(result[`color.foreground.${role}.onSolid`]).toBe(formatOklch(family.contrast));
					expect(result[`color.border.${role}`]).toBe(formatOklch(family[7]));
				}
			});

			it(`defaults border.focus to the accent family's step 8 when focus is omitted (${mode})`, () => {
				const background = BACKGROUND[mode];
				const families = buildFamilies(mode, background);
				const surfaces = generateSurfaces({ background, mode });

				const result = mapSemanticColors({
					backdrop: 'oklch(0 0 0 / 0.45)',
					controlBorder: CONTROL_BORDER[mode],
					families,
					surfaces,
				});

				expect(result['color.border.focus']).toBe(formatOklch(families.accent[8]));
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
					surfaces,
				});

				// Comparing the whole key set both ways is what makes this a completeness check: a missing
				// leaf leaves `buildTheme` emitting an undefined variable, and an extra key is a path that
				// is outside the contract and so is silently dropped.
				expect(Object.keys(result).sort()).toEqual([...colourPaths].sort());
			});
		}
	});

	describe('overlay', () => {
		it('passes the authored backdrop value through verbatim, alpha channel included', () => {
			const background = BACKGROUND.light;
			const families = buildFamilies('light', background);
			const surfaces = generateSurfaces({ background, mode: 'light' });
			const backdrop = 'oklch(0 0 0 / 0.5)';

			const result = mapSemanticColors({
				backdrop,
				controlBorder: CONTROL_BORDER.light,
				families,
				surfaces,
			});

			expect(result['color.overlay.backdrop']).toBe(backdrop);
		});

		it('derives hover and pressed from the mode-resolved high-contrast neutral, not black or white', () => {
			const overlaysFor = (mode: 'light' | 'dark') => {
				const background = BACKGROUND[mode];
				const families = buildFamilies(mode, background);
				const result = mapSemanticColors({
					backdrop: 'oklch(0 0 0 / 0.5)',
					controlBorder: CONTROL_BORDER[mode],
					families,
					surfaces: generateSurfaces({ background, mode }),
				});
				return {
					hover: result['color.overlay.hover'],
					neutral: formatOklch(families.neutral[12]),
					pressed: result['color.overlay.pressed'],
				};
			};

			const light = overlaysFor('light');
			const dark = overlaysFor('dark');
			expect(light.hover).toBe(
				`color-mix(in oklab, ${light.neutral} ${OVERLAY_HOVER_PERCENT}%, transparent)`,
			);
			expect(light.pressed).toBe(
				`color-mix(in oklab, ${light.neutral} ${OVERLAY_PRESSED_PERCENT}%, transparent)`,
			);
			expect(dark.hover).toBe(
				`color-mix(in oklab, ${dark.neutral} ${OVERLAY_HOVER_PERCENT}%, transparent)`,
			);
			expect(dark.pressed).toBe(
				`color-mix(in oklab, ${dark.neutral} ${OVERLAY_PRESSED_PERCENT}%, transparent)`,
			);
			expect(light.neutral).not.toBe('oklch(0 0 0)');
			expect(dark.neutral).not.toBe('oklch(1 0 0)');
			expect(light.neutral).not.toBe(dark.neutral);
		});
	});
});
