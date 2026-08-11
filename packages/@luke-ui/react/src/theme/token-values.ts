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
import { MOTION_DURATION_SCALE } from './motion.js';

/**
 * Structural block sizes for the small and medium controls, the minimum tap target, and
 * Combobox's square actions.
 */
export const CONTROL_SIZE_VALUES = {
	'controlSize.comboboxAction': '28px',
	'controlSize.medium': '40px',
	'controlSize.minTarget': '24px',
	'controlSize.small': '32px',
} as const;

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

/**
 * Fixed metrics for each public type style: font size, line height, and letter spacing. Family,
 * weight, and Capsize trims are resolved in the stylesheet from the active theme.
 */
export const FONT_VALUES = {
	'font.caption.fontSize': '12px',
	'font.caption.letterSpacing': '0.0025em',
	'font.caption.lineHeight': '16px',
	'font.label.fontSize': '14px',
	'font.label.letterSpacing': '0',
	'font.label.lineHeight': '20px',
	'font.body.fontSize': '16px',
	'font.body.letterSpacing': '0',
	'font.body.lineHeight': '24px',
	'font.lead.fontSize': '18px',
	'font.lead.letterSpacing': '-0.0025em',
	'font.lead.lineHeight': '26px',
	'font.heading4.fontSize': '20px',
	'font.heading4.letterSpacing': '-0.005em',
	'font.heading4.lineHeight': '28px',
	'font.heading3.fontSize': '24px',
	'font.heading3.letterSpacing': '-0.00625em',
	'font.heading3.lineHeight': '30px',
	'font.heading2.fontSize': '28px',
	'font.heading2.letterSpacing': '-0.0075em',
	'font.heading2.lineHeight': '36px',
	'font.heading1.fontSize': '35px',
	'font.heading1.letterSpacing': '-0.01em',
	'font.heading1.lineHeight': '40px',
	'font.display.fontSize': '60px',
	'font.display.letterSpacing': '-0.025em',
	'font.display.lineHeight': '60px',
} as const;

/** Inline and block sizes for the four public icon sizes. */
export const ICON_SIZE_VALUES = {
	'iconSize.large': '32px',
	'iconSize.medium': '24px',
	'iconSize.small': '20px',
	'iconSize.xsmall': '16px',
} as const;

/** The fade every control recipe applies to a disabled or pending control. */
export const INTERACTION_VALUES = {
	'interaction.disabledOpacity': '0.55',
} as const;

/** Durations and easing curves for interaction motion, named for the role each plays. */
export const MOTION_VALUES = {
	'motion.duration.enter': MOTION_DURATION_SCALE[500],
	'motion.duration.exit': MOTION_DURATION_SCALE[300],
	'motion.duration.feedback': MOTION_DURATION_SCALE[200],
	'motion.easing.exit': 'cubic-bezier(0.3, 0, 1, 1)',
	'motion.easing.standard': 'cubic-bezier(0, 0, 0.4, 1)',
} as const;
