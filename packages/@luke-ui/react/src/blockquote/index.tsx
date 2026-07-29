import * as styles from '../recipes/blockquote.css.js';
import { Text } from '../text/index.js';
import type { TextProps } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';

type _BlockquoteOmit = DistributiveOmit<TextProps, 'color' | 'elementType'>;

interface _BlockquoteProps extends _BlockquoteOmit {}

/**
 * Props for the `Blockquote` component.
 *
 * @tier atom
 */
export type BlockquoteProps = Prettify<_BlockquoteProps>;

/**
 * Block-level quotation from another source, rendered as `<blockquote>`.
 * Composes `Text` for the type scale and semantic font-weight controls.
 */
export function Blockquote(props: BlockquoteProps) {
	const { children, className, ...textProps } = props;
	return (
		<Text {...textProps} elementType="blockquote" className={cx(styles.blockquote(), className)}>
			{children}
		</Text>
	);
}
