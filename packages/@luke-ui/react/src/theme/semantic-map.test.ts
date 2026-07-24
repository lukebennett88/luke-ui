import { describe, expect, it } from 'vite-plus/test';
import type { Oklch } from './color.js';
import { formatOklch, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import { generateSurfaces } from './elevation.js';
import { defaultSourceColors } from './foundation.js';
import type { FamilyRole, ScaleFamily } from './scale.js';
import { generateFamily } from './scale.js';
import { mapSemanticColors } from './semantic-map.js';

type ColorMode = 'light' | 'dark';

const BACKGROUND: Record<ColorMode, Oklch> = {
	dark: parseColor('oklch(0.18 0.004 250)'),
	light: parseColor('oklch(0.99 0.003 250)'),
};

const MODES: ReadonlyArray<ColorMode> = ['light', 'dark'];
const ACTION_ROLES = ['neutral', 'accent', 'danger'] as const;
const FEEDBACK_ROLES = ['info', 'success', 'warning'] as const;

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
				const scrim = 'oklch(0 0 0 / 0.45)';
				const focus = parseColor('oklch(0.6 0.2 260)');

				const result = mapSemanticColors({ families, focus, mode, scrim, surfaces });

				// Surfaces: canvas IS the background.
				expect(result['color.surface.canvas']).toBe(formatOklch(surfaces.canvas));
				expect(result['color.surface.recessed']).toBe(formatOklch(surfaces.recessed));
				expect(result['color.surface.floating']).toBe(formatOklch(surfaces.floating));
				expect(result['color.surface.overlay']).toBe(formatOklch(surfaces.overlay));
				expect(result['color.scrim']).toBe(scrim);
				expect(result['color.loadingSkeleton']).toBe(formatOklch(families.neutral[3]));

				// Global text / borders: neutral only.
				expect(result['color.text.primary']).toBe(formatOklch(families.neutral[12]));
				expect(result['color.text.secondary']).toBe(formatOklch(families.neutral[11]));
				expect(result['color.text.disabled']).toBe(formatOklch(families.neutral[8]));
				expect(result['color.border.decorative']).toBe(formatOklch(families.neutral[6]));
				expect(result['color.border.control']).toBe(formatOklch(families.neutral[7]));
				expect(result['color.border.focus']).toBe(formatOklch(focus));

				// Action intents: full ramp, keyed to the intent's own family.
				for (const role of ACTION_ROLES) {
					const family = families[role];
					expect(result[`color.intent.${role}.surface.subtle`]).toBe(formatOklch(family[3]));
					expect(result[`color.intent.${role}.surface.subtleHover`]).toBe(formatOklch(family[4]));
					expect(result[`color.intent.${role}.surface.subtlePressed`]).toBe(formatOklch(family[5]));
					expect(result[`color.intent.${role}.surface.solid`]).toBe(formatOklch(family[9]));
					expect(result[`color.intent.${role}.surface.solidHover`]).toBe(formatOklch(family[10]));
					// Deliberate dup: pressed reuses the hover value.
					expect(result[`color.intent.${role}.surface.solidPressed`]).toBe(formatOklch(family[10]));
					expect(result[`color.intent.${role}.onSolid`]).toBe(formatOklch(family.contrast));
				}
				for (const role of ['accent', 'danger'] as const) {
					const family = families[role];
					expect(result[`color.intent.${role}.border`]).toBe(formatOklch(family[7]));
					expect(result[`color.intent.${role}.text`]).toBe(formatOklch(family[11]));
				}
				expect(result['color.intent.accent.textHover']).toBe(formatOklch(families.accent[12]));

				// Feedback intents: reduced kit only.
				for (const role of FEEDBACK_ROLES) {
					const family = families[role];
					expect(result[`color.intent.${role}.surface.subtle`]).toBe(formatOklch(family[3]));
					expect(result[`color.intent.${role}.border`]).toBe(formatOklch(family[7]));
					expect(result[`color.intent.${role}.text`]).toBe(formatOklch(family[11]));
				}
			});

			it(`defaults border.focus to the accent family's step 8 when focus is omitted (${mode})`, () => {
				const background = BACKGROUND[mode];
				const families = buildFamilies(mode, background);
				const surfaces = generateSurfaces({ background, mode });

				const result = mapSemanticColors({
					families,
					mode,
					scrim: 'oklch(0 0 0 / 0.45)',
					surfaces,
				});

				expect(result['color.border.focus']).toBe(formatOklch(families.accent[8]));
			});
		}
	});

	describe('completeness', () => {
		// Every generated colour leaf (every `color.*` path except the passed-through `color.scrim`)
		// must receive a value.
		const generatedColourPaths = flattenThemeContract().filter(
			([path]) => path.startsWith('color.') && path !== 'color.scrim',
		);

		for (const mode of MODES) {
			it(`assigns every generated colour leaf a value (${mode})`, () => {
				const background = BACKGROUND[mode];
				const families = buildFamilies(mode, background);
				const surfaces = generateSurfaces({ background, mode });

				const result = mapSemanticColors({
					families,
					mode,
					scrim: 'oklch(0 0 0 / 0.45)',
					surfaces,
				});

				for (const [path] of generatedColourPaths) {
					expect(typeof result[path]).toBe('string');
				}
			});
		}
	});

	describe('scrim', () => {
		it('passes the authored scrim value through verbatim, alpha channel included', () => {
			const background = BACKGROUND.light;
			const families = buildFamilies('light', background);
			const surfaces = generateSurfaces({ background, mode: 'light' });
			const scrim = 'oklch(0 0 0 / 0.5)';

			const result = mapSemanticColors({ families, mode: 'light', scrim, surfaces });

			expect(result['color.scrim']).toBe(scrim);
		});
	});
});
