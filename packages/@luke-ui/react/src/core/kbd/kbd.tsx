import { cx } from '../../shared/utils/utils.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedKbdElementProps } from '../types/documented-intrinsic-props.js';
import type { Prettify } from '../types/prettify.js';
import { kbdRecipe } from './recipe.css.js';

type _KbdOmit = DistributiveOmit<React.ComponentProps<'kbd'>, never>;

interface _KbdProps extends _KbdOmit, DocumentedKbdElementProps {}

/** Props for the `Kbd` component. */
export type KbdProps = Prettify<_KbdProps>;

/**
 * Represents keyboard input or a hotkey, rendered as `<kbd>`.
 */
export function Kbd(props: KbdProps) {
	const { className, ...elementProps } = props;
	return <kbd {...elementProps} className={cx(kbdRecipe(), className)} />;
}
