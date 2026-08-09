/**
 * The fixed values behind the contract's non-colour leaves: motion, the type scale and its Capsize
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

/** Capsize font metrics for each curated font-family choice. */
export const FONT_METRICS = {
	'apple-system': appleSystemMetrics,
	'dm-sans': dMSansMetrics,
	inter: interMetrics,
} as const;

/** The fixed type scale: size, line height, and letter spacing for each of the nine steps. */
export const FONT_VALUES = {
	'font.100.fontSize': '12px',
	'font.100.letterSpacing': '0.0025em',
	'font.100.lineHeight': '16px',
	'font.200.fontSize': '14px',
	'font.200.letterSpacing': '0',
	'font.200.lineHeight': '20px',
	'font.300.fontSize': '16px',
	'font.300.letterSpacing': '0',
	'font.300.lineHeight': '24px',
	'font.400.fontSize': '18px',
	'font.400.letterSpacing': '-0.0025em',
	'font.400.lineHeight': '26px',
	'font.500.fontSize': '20px',
	'font.500.letterSpacing': '-0.005em',
	'font.500.lineHeight': '28px',
	'font.600.fontSize': '24px',
	'font.600.letterSpacing': '-0.00625em',
	'font.600.lineHeight': '30px',
	'font.700.fontSize': '28px',
	'font.700.letterSpacing': '-0.0075em',
	'font.700.lineHeight': '36px',
	'font.800.fontSize': '35px',
	'font.800.letterSpacing': '-0.01em',
	'font.800.lineHeight': '40px',
	'font.900.fontSize': '60px',
	'font.900.letterSpacing': '-0.025em',
	'font.900.lineHeight': '60px',
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
