import type { ComponentProps } from 'react';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleProps } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { resolveKbdRecipeStyles } from './recipe.js';

interface _KbdProps extends ComponentProps<'kbd'> {
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `Kbd`'s own styles and
	 * before `className`. A same-property `xstyle` value wins over those styles. A consumer
	 * `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/** Props for the `Kbd` component. */
export type KbdProps = Prettify<_KbdProps>;

/**
 * Represents keyboard input or a hotkey, rendered as `<kbd>`.
 */
export function Kbd(props: KbdProps) {
	const { className, style, xstyle, ...elementProps } = props;
	const stylexProps = resolveXStyleProps(resolveKbdRecipeStyles(), xstyle, className, style);
	return <kbd {...elementProps} {...stylexProps} />;
}
