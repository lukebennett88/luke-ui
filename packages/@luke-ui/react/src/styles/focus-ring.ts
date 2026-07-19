/**
 * The shared focus outline block, keyed off one outline colour. Plain values only, so it is
 * usable from Panda global styles and recipe definitions; pass the token reference the call site
 * resolves.
 */
export function focusRing(color: string) {
	return {
		outlineColor: color,
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	} as const;
}
