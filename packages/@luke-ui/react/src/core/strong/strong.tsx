import type { XStyleProps } from '../styles/xstyle.js';
import type { TextProps } from '../text/text.js';
import { renderText } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { resolveStrongRecipeStyles } from './recipe.js';

interface StrongStyleProps extends XStyleProps {
	/**
	 * Clamps text lines. `true` clamps to 1 line; numeric values clamp to 1–5.
	 */
	lineClamp?: TextProps['lineClamp'];
	/**
	 * Sets text wrapping behavior.
	 * @default 'unset'
	 */
	textWrap?: TextProps['textWrap'];
}

type _StrongOmit = DistributiveOmit<React.ComponentProps<'strong'>, 'color'>;

interface _StrongProps extends _StrongOmit, StrongStyleProps {}

/** Props for the `Strong` component. */
export type StrongProps = Prettify<_StrongProps>;

/**
 * Marks text with strong importance, rendered as `<strong>`.
 * Composes `Text`, inherits surrounding typography, and applies the emphasis weight.
 */
export function Strong(props: StrongProps) {
	const { className, lineClamp, textWrap, xstyle, ...elementProps } = props;
	return renderText(
		{
			...elementProps,
			className,
			elementType: 'strong',
			lineClamp,
			shouldInheritFont: true,
			textWrap,
			xstyle,
		},
		resolveStrongRecipeStyles(),
	);
}
