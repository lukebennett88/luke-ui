/**
 * The shared focus outline block, keyed off one outline colour. Plain values only, so it is
 * usable from both vanilla-extract styles and Panda recipe definitions; pass whichever token
 * reference form the call site's styling system resolves.
 */
export function focusRing(color: string) {
	return {
		outlineColor: color,
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	} as const;
}
