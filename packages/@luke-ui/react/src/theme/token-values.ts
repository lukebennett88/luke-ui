/**
 * The fixed values behind the contract's non-colour leaves: motion, typography styles and Capsize
 * metrics, icon sizes, control sizes, and the disabled-control opacity. None of them depend on a
 * theme's source colours, so they live here beside `contract.ts` rather than inside the compiler.
 *
 * The spacing scale is the exception: it stays in `contract.ts` as `spaceScale`, because it is also
 * the source of the public `SpaceStep` type.
 */

import appleSystemMetrics from '@capsizecss/metrics/appleSystem';
import dMSansMetrics from '@capsizecss/metrics/dMSans';
import interMetrics from '@capsizecss/metrics/inter';
import { typeStyleMetricStep, typeStyles } from './contract.js';
import type { IdentityPath, TypeStyle } from './contract.js';
import { FONT_METRIC_SCALE } from './font-metric-scale.js';
import { MOTION_DURATION_SCALE } from './motion.js';
import { pathEntry, pathRecord } from './path-record.js';

/**
 * Structural block sizes for the small and medium controls, the minimum tap target, and
 * Combobox's square actions.
 */
export const CONTROL_SIZE_VALUES: {
	[Path in Extract<IdentityPath, `controlSize.${string}`>]: string;
} = {
	'controlSize.comboboxAction': '28px',
	'controlSize.medium': '40px',
	'controlSize.minTarget': '24px',
	'controlSize.small': '32px',
};

/**
 * Shape of a Capsize font-metrics object, named locally so `.d.ts` output never needs Capsize's
 * unexported per-font interfaces.
 */
type CapsizeFontMetrics = {
	ascent: number;
	capHeight: number;
	descent: number;
	lineGap: number;
	unitsPerEm: number;
	xHeight: number;
};

/** Capsize font metrics for each curated font-family choice. */
export const FONT_METRICS: Record<'apple-system' | 'dm-sans' | 'inter', CapsizeFontMetrics> = {
	'apple-system': appleSystemMetrics,
	'dm-sans': dMSansMetrics,
	inter: interMetrics,
};

type FontValueLeaf = 'fontSize' | 'letterSpacing' | 'lineHeight';
type FontValueKey = `font.${TypeStyle}.${FontValueLeaf}`;

function styleMetrics(style: TypeStyle) {
	return FONT_METRIC_SCALE[typeStyleMetricStep[style]];
}

/**
 * Fixed metrics for each public type style: font size, line height, and letter spacing, resolved
 * from the private metric scale. Family, weight, and Capsize trims are resolved in the stylesheet
 * from the active theme.
 */
export const FONT_VALUES: { readonly [Key in FontValueKey]: string } = pathRecord(
	typeStyles.flatMap((style) => {
		const metrics = styleMetrics(style);
		return [
			pathEntry(`font.${style}.fontSize`, metrics.fontSize),
			pathEntry(`font.${style}.letterSpacing`, metrics.letterSpacing),
			pathEntry(`font.${style}.lineHeight`, metrics.lineHeight),
		];
	}),
);

/** Inline and block sizes for the four public icon sizes. */
export const ICON_SIZE_VALUES: {
	[Path in Extract<IdentityPath, `iconSize.${string}`>]: string;
} = {
	'iconSize.large': '32px',
	'iconSize.medium': '24px',
	'iconSize.small': '20px',
	'iconSize.xsmall': '16px',
};

/** The fade every control recipe applies to a disabled or pending control. */
export const INTERACTION_VALUES: {
	[Path in Extract<IdentityPath, `interaction.${string}`>]: string;
} = {
	'interaction.disabledOpacity': '0.55',
};

/** Durations and easing curves for interaction motion, named for the role each plays. */
export const MOTION_VALUES: {
	[Path in Extract<IdentityPath, `motion.${string}`>]: string;
} = {
	'motion.duration.enter': MOTION_DURATION_SCALE[500],
	'motion.duration.exit': MOTION_DURATION_SCALE[300],
	'motion.duration.feedback': MOTION_DURATION_SCALE[200],
	'motion.easing.exit': 'cubic-bezier(0.3, 0, 1, 1)',
	'motion.easing.standard': 'cubic-bezier(0, 0, 0.4, 1)',
};
