import * as styles from '../recipes/kbd.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';

type _KbdOmit = DistributiveOmit<React.ComponentProps<'kbd'>, never>;

interface _KbdProps extends _KbdOmit {}

/**
 * Props for the `Kbd` component.
 *
 * @tier atom
 */
export type KbdProps = Prettify<_KbdProps>;

/**
 * Represents keyboard input or a hotkey, rendered as `<kbd>`.
 */
export function Kbd(props: KbdProps) {
	const { className, ...elementProps } = props;
	return <kbd {...elementProps} className={cx(styles.kbd(), className)} />;
}
