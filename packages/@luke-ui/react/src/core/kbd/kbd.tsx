import type { ComponentProps } from 'react';
import type { XStyleProps } from '../styles/xstyle.js';
import { composeRecipeProps } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { kbdRecipe } from './recipe.js';

interface _KbdProps extends ComponentProps<'kbd'>, XStyleProps {}

/** Props for the `Kbd` component. */
export type KbdProps = Prettify<_KbdProps>;

/**
 * Represents keyboard input or a hotkey, rendered as `<kbd>`.
 */
export function Kbd(props: KbdProps) {
	const { className, style, xstyle, ...elementProps } = props;
	const recipeProps = kbdRecipe({ xstyle });

	return <kbd {...elementProps} {...composeRecipeProps(recipeProps, className, style)} />;
}
