import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { kbdRecipe } from './recipe.css.js';

type _KbdOmit = DistributiveOmit<React.ComponentProps<'kbd'>, 'color'>;

interface _KbdProps extends _KbdOmit {}

/** Props for the `Kbd` component. */
export type KbdProps = Prettify<_KbdProps>;

/**
 * Represents keyboard input or a hotkey, rendered as `<kbd>`.
 * Inherits typography it does not set, such as letter-spacing. Sets its own code font, size,
 * weight, and line height, so the chip stays one size in any surrounding text.
 */
export function Kbd(props: KbdProps) {
	const { className, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			className={kbdRecipe({ className })}
			elementType="kbd"
			shouldInheritFont
		/>
	);
}
