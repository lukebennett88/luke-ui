import type { XStyleProps } from '../styles/xstyle.js';
import { Text } from '../text/text.js';
import type { TextProps } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { styles } from './recipe.js';

type _BlockquoteOmit = DistributiveOmit<TextProps, 'color' | 'elementType' | 'xstyle'>;

interface _BlockquoteProps extends _BlockquoteOmit, XStyleProps {}

/** Props for the `Blockquote` component. */
export type BlockquoteProps = Prettify<_BlockquoteProps>;

/**
 * Block-level quotation from another source, rendered as `<blockquote>`.
 * Composes `Text` for typography styles and semantic font-weight controls.
 */
export function Blockquote(props: BlockquoteProps) {
	const { children, className, xstyle, ...textProps } = props;
	return (
		<Text
			{...textProps}
			className={className}
			elementType="blockquote"
			xstyle={[styles.root, xstyle]}
		>
			{children}
		</Text>
	);
}
