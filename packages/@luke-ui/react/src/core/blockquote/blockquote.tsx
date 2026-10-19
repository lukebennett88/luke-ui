import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { blockquoteRecipe } from './recipe.css.js';

// `TextProps` is a union (`elementType` vs `renderRoot`), so the omit stays a type alias.
type _BlockquoteProps = DistributiveOmit<TextProps, 'color' | 'elementType'>;

/** Props for the `Blockquote` component. */
export type BlockquoteProps = Prettify<_BlockquoteProps>;

/**
 * Block-level quotation from another source, rendered as `<blockquote>`.
 * Accepts the typography and semantic font-weight props.
 */
export function Blockquote(props: BlockquoteProps) {
	const { children, className, renderRoot, ...textProps } = props;
	const recipeClassName = blockquoteRecipe({ className });

	if (renderRoot) {
		return (
			<Text className={recipeClassName} renderRoot={renderRoot} {...textProps}>
				{children}
			</Text>
		);
	}

	return (
		<Text {...textProps} className={recipeClassName} elementType="blockquote">
			{children}
		</Text>
	);
}
