/**
 * Declarations that paint a built-in icon's mask over `currentColor`, so the icon follows the text
 * colour like the glyphs beside it. Pass `maskImage` from the generated `iconMaskUrls`, or leave it
 * out when a selector supplies it.
 */
export function iconMaskStyle(maskImage?: string) {
	return {
		backgroundColor: 'currentColor',
		// Forced colours would replace the background with `Canvas` and erase the icon. Like the UA
		// style for `<svg>`, this keeps the author background but resolves `currentColor` to the forced
		// colour the icon inherits. `none` would paint the unforced author colour instead.
		forcedColorAdjust: 'preserve-parent-color',
		...(maskImage == null ? {} : { maskImage }),
		maskPosition: 'center',
		maskRepeat: 'no-repeat',
		maskSize: 'contain',
	} as const;
}
