export { blockquoteRecipe, type BlockquoteRecipeVariants } from './recipe.css.js';
import * as styles from '../blockquote/recipe.css.js';
import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';

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
		<Text
			{...textProps}
			className={cx(styles.blockquoteRecipe(), className)}
			elementType="blockquote"
		>
			{children}
		</Text>
	);
}
