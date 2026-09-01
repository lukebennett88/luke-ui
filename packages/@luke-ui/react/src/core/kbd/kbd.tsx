import type { ComponentProps } from 'react';
import type { XStyleProps } from '../styles/xstyle.js';
import { resolveXStyleProps } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { resolveKbdRecipeStyles } from './recipe.js';

interface _KbdProps extends ComponentProps<'kbd'>, XStyleProps {}

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
