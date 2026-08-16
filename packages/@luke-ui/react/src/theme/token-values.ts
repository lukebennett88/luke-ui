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
import { typeStyleMetricStep } from './contract.js';
import type { IdentityPath, TypeStyle } from './contract.js';
import { FONT_METRIC_SCALE } from './font-metric-scale.js';
import { MOTION_DURATION_SCALE } from './motion.js';

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
export const FONT_VALUES: { readonly [Key in FontValueKey]: string } = {
	'font.body.fontSize': styleMetrics('body').fontSize,
	'font.body.letterSpacing': styleMetrics('body').letterSpacing,
	'font.body.lineHeight': styleMetrics('body').lineHeight,
	'font.caption.fontSize': styleMetrics('caption').fontSize,
	'font.caption.letterSpacing': styleMetrics('caption').letterSpacing,
	'font.caption.lineHeight': styleMetrics('caption').lineHeight,
	'font.display.fontSize': styleMetrics('display').fontSize,
	'font.display.letterSpacing': styleMetrics('display').letterSpacing,
	'font.display.lineHeight': styleMetrics('display').lineHeight,
	'font.heading1.fontSize': styleMetrics('heading1').fontSize,
	'font.heading1.letterSpacing': styleMetrics('heading1').letterSpacing,
	'font.heading1.lineHeight': styleMetrics('heading1').lineHeight,
	'font.heading2.fontSize': styleMetrics('heading2').fontSize,
	'font.heading2.letterSpacing': styleMetrics('heading2').letterSpacing,
	'font.heading2.lineHeight': styleMetrics('heading2').lineHeight,
	'font.heading3.fontSize': styleMetrics('heading3').fontSize,
	'font.heading3.letterSpacing': styleMetrics('heading3').letterSpacing,
	'font.heading3.lineHeight': styleMetrics('heading3').lineHeight,
	'font.heading4.fontSize': styleMetrics('heading4').fontSize,
	'font.heading4.letterSpacing': styleMetrics('heading4').letterSpacing,
	'font.heading4.lineHeight': styleMetrics('heading4').lineHeight,
	'font.label.fontSize': styleMetrics('label').fontSize,
	'font.label.letterSpacing': styleMetrics('label').letterSpacing,
	'font.label.lineHeight': styleMetrics('label').lineHeight,
	'font.lead.fontSize': styleMetrics('lead').fontSize,
	'font.lead.letterSpacing': styleMetrics('lead').letterSpacing,
	'font.lead.lineHeight': styleMetrics('lead').lineHeight,
	'font.support.fontSize': styleMetrics('support').fontSize,
	'font.support.letterSpacing': styleMetrics('support').letterSpacing,
	'font.support.lineHeight': styleMetrics('support').lineHeight,
};

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
