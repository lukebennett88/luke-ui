/**
 * The fixed values behind the contract's non-colour leaves: motion, typography style metrics,
 * control sizes, and the disabled-control opacity. None of them depend on a
 * theme's source colours, so they live here beside `contract.ts` rather than inside the compiler.
 *
 * The spacing scale is the exception: it stays in `contract.ts` as `spaceScale`, because it is also
 * the source of the public `SpaceStep` type.
 */

import type { IdentityPath } from './contract.js';
import { FONT_METRIC_SCALE } from './font-metric-scale.js';
import { MOTION_DURATION_SCALE } from './motion.js';
import { pathEntry, pathRecord } from './path-record.js';
import { rem } from './rem.js';
import type { TypeStyle } from './type-styles.js';
import { typeStyleMetricStep, typeStyles } from './type-styles.js';

/** Structural block sizes for the small and medium controls. */
export const CONTROL_SIZE_VALUES: {
	[Path in Extract<IdentityPath, `controlSize.${string}`>]: string;
} = {
	'controlSize.medium': rem(40),
	'controlSize.small': rem(32),
};

type FontValueLeaf = 'fontSize' | 'letterSpacing' | 'lineHeight';
type FontValueKey = `font.${TypeStyle}.${FontValueLeaf}`;

function styleMetrics(style: TypeStyle) {
	return FONT_METRIC_SCALE[typeStyleMetricStep[style]];
}

/**
 * Fixed metrics for each public type style: font size, line height, and letter spacing, resolved
 * from the private metric scale. Family and weight are resolved in the stylesheet from the active
 * theme, and so are the private Capsize trims.
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

/** The fade every control recipe applies to a disabled or pending control. */
export const INTERACTION_VALUES: {
	[Path in Extract<IdentityPath, `interaction.${string}`>]: string;
} = {
	'interaction.disabledOpacity': '0.55',
};

/**
 * Private default decelerating curve shared by feedback and enter. Each treatment still emits its
 * own public custom property so the curves can diverge later without an alias.
 */
const DECELERATE_EASING = 'cubic-bezier(0, 0, 0.4, 1)';

/** Private accelerating curve for exit. */
const ACCELERATE_EASING = 'cubic-bezier(0.3, 0, 1, 1)';

/** Duration and easing for each public motion treatment. */
export const MOTION_VALUES: {
	[Path in Extract<IdentityPath, `motion.${string}`>]: string;
} = {
	'motion.enter.duration': MOTION_DURATION_SCALE[500],
	'motion.enter.easing': DECELERATE_EASING,
	'motion.exit.duration': MOTION_DURATION_SCALE[300],
	'motion.exit.easing': ACCELERATE_EASING,
	'motion.feedback.duration': MOTION_DURATION_SCALE[200],
	'motion.feedback.easing': DECELERATE_EASING,
};
