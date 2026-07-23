import type { ComponentPropsWithRef, JSX } from 'react';
import { visuallyHidden } from '../recipes/visually-hidden.css.js';
import type { Prettify } from '../types/prettify.js';
import type { RenderProp } from '../types/render-prop.js';
import { cx, mergeProps } from '../utils/index.js';

interface _VisuallyHiddenProps extends ComponentPropsWithRef<'span'> {
	/**
	 * Renders a custom or semantic element while keeping VisuallyHidden's styles.
	 * Spread the supplied props on the element you return so it receives the class
	 * name, inline style, ref, and other DOM props.
	 */
	render?: RenderProp<'span'>;
}

/**
 * Props for `VisuallyHidden`.
 *
 * @tier atom
 */
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
 * Renders a `span` by default. Pass `render` to keep the hidden styles on a
 * different element, such as a semantic tag or a motion wrapper.
 */
export function VisuallyHidden(props: VisuallyHiddenProps): JSX.Element {
	const { className, render, style, ...restProps } = props;
	const domProps = mergeProps(restProps, {
		className: cx(visuallyHidden(), className),
		style,
	});
	return render ? render(domProps, undefined) : <span {...domProps} />;
}
