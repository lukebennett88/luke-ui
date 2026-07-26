/**
 * The static values behind the theme contract's non-colour leaves: the spacing scale, the motion
 * durations and easings, the composite type steps, the curated Capsize font metrics, and the icon and
 * control size scales. Keyed by the contract path each value fills (spacing by its scale step), so the
 * stylesheet writer assembles the identity block by lookup instead of carrying the numbers itself.
 *
 * These are the authored values of the contract declared in `contract.ts`, so they live beside it
 * rather than inside the colour pipeline: nothing here depends on a colour, a mode, or the authored
 * foundation.
 */

import appleSystemMetrics from '@capsizecss/metrics/appleSystem';
import dMSansMetrics from '@capsizecss/metrics/dMSans';
import interMetrics from '@capsizecss/metrics/inter';

/** The semantic spacing scale, keyed by step rather than by contract path. */
export const SPACE_VALUES = {
	100: '4px',
	200: '8px',
	300: '12px',
	400: '16px',
	600: '24px',
	800: '32px',
	1000: '40px',
	1200: '48px',
	1600: '64px',
} as const;

/** Luke UI-owned durations and easing curves for interaction motion. */
export const MOTION_VALUES = {
	'motion.duration.fast': '120ms',
	'motion.easing.exit': 'cubic-bezier(0.3, 0, 1, 1)',
	'motion.easing.standard': 'cubic-bezier(0, 0, 0.4, 1)',
} as const;

/**
 * The composite type steps: font size, line height, and letter spacing per step. The per-font Capsize
 * trims are computed from the size and line height by the stylesheet writer.
 */
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

/** Capsize font metrics for each curated font-family choice. */
export const FONT_METRICS = {
	'apple-system': appleSystemMetrics,
	'dm-sans': dMSansMetrics,
	inter: interMetrics,
} as const;

/** Inline and block sizes for the four public icon sizes. */
export const ICON_SIZE_VALUES = {
	'iconSize.large': '32px',
	'iconSize.medium': '24px',
	'iconSize.small': '20px',
	'iconSize.xsmall': '16px',
} as const;

/** Structural block sizes for the two public control sizes. */
export const CONTROL_SIZE_VALUES = {
	'controlSize.medium': '40px',
	'controlSize.small': '32px',
} as const;
