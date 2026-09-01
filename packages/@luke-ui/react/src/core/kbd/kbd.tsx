import type { ComponentProps } from 'react';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleClassName } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { kbdRecipe } from './recipe.js';

interface _KbdProps extends ComponentProps<'kbd'> {
	/**
	 * Escape hatch for styling properties `Kbd`'s own styles do not set, as one or more
	 * `stylex.create(...)` style objects. Applied after `Kbd`'s own styles and before `className`, so
	 * a consumer `className` still beats it.
	 */
	xstyle?: XStyleProp;
}

/** Props for the `Kbd` component. */
export type KbdProps = Prettify<_KbdProps>;

/**
 * Represents keyboard input or a hotkey, rendered as `<kbd>`.
 */
export function Kbd(props: KbdProps) {
	const { className, xstyle, ...elementProps } = props;
	return (
		<kbd {...elementProps} className={resolveXStyleClassName(kbdRecipe(), xstyle, className)} />
	);
}
