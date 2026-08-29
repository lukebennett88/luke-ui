import type { ComponentProps } from 'react';
import { cx } from '../../shared/utils/utils.js';
import type { Prettify } from '../types/prettify.js';
import { kbdRecipe } from './recipe.css.js';

interface _KbdProps extends ComponentProps<'kbd'> {}

/** Props for the `Kbd` component. */
export type KbdProps = Prettify<_KbdProps>;

/**
 * Represents keyboard input or a hotkey, rendered as `<kbd>`.
 */
export function Kbd(props: KbdProps) {
	const { className, ...elementProps } = props;
	return <kbd {...elementProps} className={cx(kbdRecipe(), className)} />;
}
