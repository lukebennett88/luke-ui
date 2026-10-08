import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { kbdRecipe } from './recipe.css.js';

type _KbdOmit = DistributiveOmit<React.ComponentProps<'kbd'>, 'color' | 'slot'>;

interface _KbdProps extends _KbdOmit {}

/** Props for the `Kbd` component. */
export type KbdProps = Prettify<_KbdProps>;

/**
 * Represents keyboard input as `<kbd>`. Uses the body font at a size relative to surrounding text,
 * with its own weight, line height, and spacing.
 *
 * It never fills a React Aria text slot, so it renders inside a field's label, description, or
 * error message.
 */
export function Kbd(props: KbdProps) {
	const { className, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			className={kbdRecipe({ className })}
			elementType="kbd"
			shouldInheritFont
			slot={null}
		/>
	);
}
