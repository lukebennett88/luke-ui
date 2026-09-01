import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleClassName } from '../styles/xstyle.js';
import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { strongRecipe } from './recipe.js';

interface StrongStyleProps {
	/**
	 * Clamps text lines. `true` clamps to 1 line; numeric values clamp to 1–5.
	 */
	lineClamp?: TextProps['lineClamp'];
	/**
	 * Sets text wrapping behavior.
	 * @default 'unset'
	 */
	textWrap?: TextProps['textWrap'];
	/**
	 * Escape hatch for styling properties `Strong`'s own styles do not set, as one or more
	 * `stylex.create(...)` style objects. Applied after `Strong`'s own styles and before
	 * `className`, so a consumer `className` still beats it.
	 */
	xstyle?: XStyleProp;
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
	return (
		<Text
			{...elementProps}
			className={resolveXStyleClassName(strongRecipe(), xstyle, className)}
			elementType="strong"
			lineClamp={lineClamp}
			shouldInheritFont
			textWrap={textWrap}
		/>
	);
}
