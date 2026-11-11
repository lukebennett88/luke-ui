/** Shared viewBox size for icon SVGs. */
export const ICON_VIEWBOX_SIZE = 24;

/** Inset from viewBox edge to content; icons use 19×19 content in 24×24 box. */
const ICON_CONTENT_INSET = 2.5;

/** Content area size (viewBox size minus insets). */
export const ICON_CONTENT_SIZE = ICON_VIEWBOX_SIZE - 2 * ICON_CONTENT_INSET;

/** Default viewBox string for icon-aligned SVGs. */
export const ICON_VIEWBOX = `0 0 ${ICON_VIEWBOX_SIZE} ${ICON_VIEWBOX_SIZE}`;

/** Inline and block sizes for icons and spinners. */
export const ICON_SIZES = {
	xsmall: '1rem',
	small: '1.25rem',
	medium: '1.5rem',
	large: '2rem',
} as const;

export type IconSize = keyof typeof ICON_SIZES;
const DEFAULT_ICON_SIZE: IconSize = 'medium';

/**
 * Public inherited property that sizes nested icons and spinners. A container sets it, and an
 * explicit `size` on an icon or spinner wins over it.
 */
const ICON_SIZE_PROPERTY = '--luke-icon-size';

/** The inline and block size an icon takes from its nearest scope, or the default size. */
export const contextualIconSize = `var(${ICON_SIZE_PROPERTY}, ${ICON_SIZES[DEFAULT_ICON_SIZE]})`;

/**
 * Sets the default size for icons and spinners inside an element. Returns `--luke-icon-size` set to
 * that size. Pass the result to the element's `style`, or to a Vanilla Extract style's `vars`. An
 * icon or spinner with its own `size` keeps that size.
 */
// The index signature keeps the result assignable to React's `style`, which rejects an object whose
// only key is a custom property.
export function iconSizeVars(size: IconSize): Record<string, string> {
	return { [ICON_SIZE_PROPERTY]: ICON_SIZES[size] };
}
