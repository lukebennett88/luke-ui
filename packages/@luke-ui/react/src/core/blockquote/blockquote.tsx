import { cx } from '../../shared/utils/utils.js';
import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { blockquoteRecipe } from './recipe.css.js';

type _BlockquoteOmit = DistributiveOmit<TextProps, 'color' | 'elementType'>;

interface _BlockquoteProps extends _BlockquoteOmit {}

/** Props for the `Blockquote` component. */
export type BlockquoteProps = Prettify<_BlockquoteProps>;

/**
 * Block-level quotation from another source, rendered as `<blockquote>`.
 * Composes `Text` for typography styles and semantic font-weight controls.
 */
export function Blockquote(props: BlockquoteProps) {
	const { children, className, ...textProps } = props;
	return (
		<Text {...textProps} className={cx(blockquoteRecipe(), className)} elementType="blockquote">
			{children}
		</Text>
	);
}
