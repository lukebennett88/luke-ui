/**
 * For controls that answer a press themselves, with a pressed state or by opening an overlay: no
 * double-tap zoom delay and no second, unthemed tap highlight.
 */
export const pressFeedback = {
	touchAction: 'manipulation',
	WebkitTapHighlightColor: 'transparent',
} as const;
