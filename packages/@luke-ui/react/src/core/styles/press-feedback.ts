/**
 * For controls that show their own pressed state: no double-tap zoom delay and no second tap
 * highlight.
 */
export const pressFeedback = {
	touchAction: 'manipulation',
	WebkitTapHighlightColor: 'transparent',
} as const;
