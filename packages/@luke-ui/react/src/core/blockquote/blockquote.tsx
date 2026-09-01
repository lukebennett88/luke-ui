import type { XStyleProp } from '../styles/xstyle.js';
import type { TextProps } from '../text/text.js';
import { renderText } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { resolveBlockquoteRecipeStyles } from './recipe.js';

type _BlockquoteOmit = DistributiveOmit<TextProps, 'color' | 'elementType' | 'xstyle'>;

interface _BlockquoteProps extends _BlockquoteOmit {
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `Blockquote`'s own
	 * styles and before `className`. A same-property `xstyle` value wins over those styles. A
	 * consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/** Props for the `Blockquote` component. */
export type BlockquoteProps = Prettify<_BlockquoteProps>;

/**
 * Block-level quotation from another source, rendered as `<blockquote>`.
 * Composes `Text` for typography styles and semantic font-weight controls.
 */
export function Blockquote(props: BlockquoteProps) {
	const { children, className, xstyle, ...textProps } = props;
	return renderText(
		{ ...textProps, children, className, elementType: 'blockquote', xstyle },
		resolveBlockquoteRecipeStyles(),
	);
}
