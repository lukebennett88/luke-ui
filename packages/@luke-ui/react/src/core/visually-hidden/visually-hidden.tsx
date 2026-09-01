import type { ComponentPropsWithRef, JSX } from 'react';
import { Text as RacText } from 'react-aria-components/Text';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleClassName } from '../styles/xstyle.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedElementTypeProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import { visuallyHiddenRecipe } from './recipe.js';

type _VisuallyHiddenOmit = DistributiveOmit<
	ComponentPropsWithRef<typeof RacText>,
	keyof DocumentedElementTypeProps
>;

interface _VisuallyHiddenProps extends _VisuallyHiddenOmit, DocumentedElementTypeProps {
	/**
	 * Escape hatch for styling properties `VisuallyHidden`'s own styles do not set, as one or more
	 * `stylex.create(...)` style objects. Applied after `VisuallyHidden`'s own styles and before
	 * `className`, so a consumer `className` still beats it.
	 */
	xstyle?: XStyleProp;
}

/** Props for `VisuallyHidden`. */
export type VisuallyHiddenProps = Prettify<_VisuallyHiddenProps>;

/**
 * Hides its content visually while keeping it available to assistive technology.
 *
 * Use it to give assistive-technology users context conveyed visually by other
 * means — a text label behind an icon-only control, extra context for a link, or
 * a status message inside a live region. The content stays in the accessibility
 * tree and the document flow (unlike `display: none` or the `hidden` attribute),
 * so it is announced and can be referenced by `aria-labelledby`/`aria-describedby`.
 *
 * Renders a `span` by default. Pass `elementType` to render a different element
 * (for example `elementType="h2"` for a screen-reader-only section heading).
 */
export function VisuallyHidden(props: VisuallyHiddenProps): JSX.Element {
	const { className, xstyle, ...racProps } = props;
	return (
		<RacText
			{...racProps}
			className={resolveXStyleClassName(visuallyHiddenRecipe(), xstyle, className)}
		/>
	);
}
