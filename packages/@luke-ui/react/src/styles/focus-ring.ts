export function focusRing(color: string) {
	return {
		outlineColor: color,
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	} as const;
}

/** The transparent resting focus ring every focusable control starts from. */
export function restingFocusRing(offset: string = '2px') {
	return {
		outlineColor: 'transparent',
		outlineOffset: offset,
		outlineStyle: 'solid',
		outlineWidth: '2px',
	} as const;
}
