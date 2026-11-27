/**
 * The app's chrome and stage sizes, in CSS pixels at a 16px root. The styles set them and the review
 * sizes its captures with them, so both read them from here. A size the theme spaces with names its
 * `vars.space` step.
 */

/** The smallest control a phone gets: a 44px touch target. */
export const TOUCH_TARGET = 44;

/** The sticky top bar on every page. */
export const TOP_BAR_HEIGHT = { compact: 48, regular: 56 } as const;

/**
 * Around a capture on wider screens. The top band holds the capture labels.
 * A phone’s capture runs edge to edge.
 */
export const STAGE_PADDING = { blockEnd: 24, blockStart: 32, inline: 24 } as const;
