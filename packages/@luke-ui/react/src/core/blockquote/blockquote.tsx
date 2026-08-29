import { cx } from '../../shared/utils/utils.js';
import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { blockquoteRecipe } from './recipe.css.js';

interface BlockquoteStyleProps {
	children?: TextProps['children'];
	className?: TextProps['className'];
	fontVariantNumeric?: TextProps['fontVariantNumeric'];
	fontWeight?: TextProps['fontWeight'];
	isVisuallyHidden?: TextProps['isVisuallyHidden'];
	lineClamp?: TextProps['lineClamp'];
	shouldDisableTrim?: TextProps['shouldDisableTrim'];
	shouldInheritFont?: TextProps['shouldInheritFont'];
	textAlign?: TextProps['textAlign'];
	textDecoration?: TextProps['textDecoration'];
	textTransform?: TextProps['textTransform'];
	textWrap?: TextProps['textWrap'];
	typography?: TextProps['typography'];
}

type _BlockquoteOmit = DistributiveOmit<TextProps, 'color' | 'elementType'>;

interface _BlockquoteProps extends _BlockquoteOmit, BlockquoteStyleProps {}

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
