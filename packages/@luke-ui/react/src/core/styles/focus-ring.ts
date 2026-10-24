export function focusRing(color: string) {
	return {
		outlineColor: color,
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	} as const;
}

/** A focus ring drawn inside the element's edge, over its fill, for items packed edge to edge. */
export function insetFocusRing(color: string) {
	return { ...focusRing(color), outlineOffset: '-2px' } as const;
}
