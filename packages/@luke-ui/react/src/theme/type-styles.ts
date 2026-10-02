/**
 * Public type styles and the weight role and metric step each resolves to. Kept apart from
 * `contract.ts` so the Text runtime can read `typeStyleWeightRole` without bundling the theme
 * contract tree.
 */

import type { FontMetricStep } from './font-metric-scale.js';

/**
 * Public semantic type styles, in ascending visual size. Each style is a complete typography
 * treatment: family, size, weight, line height, letter spacing, and Capsize trims. Styles may share
 * private metric steps when they differ by weight rather than size.
 */
export const typeStyles = [
	'caption',
	'label',
	'body',
	'lead',
	'heading4',
	'heading3',
	'heading2',
	'heading1',
	'display',
] as const;

/** A public semantic type style key. */
export type TypeStyle = (typeof typeStyles)[number];

/** Theme weight roles available on `vars.font.weight` and as `Text`/`Heading` overrides. */
export const fontWeightRoles = ['body', 'label', 'heading', 'emphasis'] as const;

/** A theme font-weight role key. */
export type FontWeightRole = (typeof fontWeightRoles)[number];

/**
 * Private metric step each public type style resolves from. Kept beside `typeStyles` so
 * `FONT_VALUES` emission cannot invent a different mapping.
 */
export const typeStyleMetricStep = {
	caption: 12,
	label: 14,
	body: 16,
	lead: 18,
	heading4: 20,
	heading3: 24,
	heading2: 28,
	heading1: 35,
	display: 60,
} as const satisfies Record<TypeStyle, FontMetricStep>;

/**
 * Theme weight role each type style resolves to. Kept beside `typeStyles` so stylesheet emission and
 * the Text recipe cannot pick different defaults.
 */
export const typeStyleWeightRole = {
	caption: 'body',
	label: 'label',
	body: 'body',
	lead: 'body',
	heading4: 'heading',
	heading3: 'heading',
	heading2: 'heading',
	heading1: 'heading',
	display: 'heading',
} as const satisfies Record<TypeStyle, FontWeightRole>;
