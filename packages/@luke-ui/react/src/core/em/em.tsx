import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleClassName } from '../styles/xstyle.js';
import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { emRecipe } from './recipe.js';

interface EmStyleProps {
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
	 * Escape hatch for styling properties `Em`'s own styles do not set, as one or more
	 * `stylex.create(...)` style objects. Applied after `Em`'s own styles and before `className`, so
	 * a consumer `className` still beats it.
	 */
	xstyle?: XStyleProp;
}

type _EmOmit = DistributiveOmit<React.ComponentProps<'em'>, 'color'>;

interface _EmProps extends _EmOmit, EmStyleProps {}

/** Props for the `Em` component. */
export type EmProps = Prettify<_EmProps>;

/**
 * Marks text to stress emphasis, rendered as `<em>`.
 * Composes `Text`, inherits surrounding typography, and applies italic styling.
 */
export function Em(props: EmProps) {
	const { className, lineClamp, textWrap, xstyle, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			className={resolveXStyleClassName(emRecipe(), xstyle, className)}
			elementType="em"
			lineClamp={lineClamp}
			shouldInheritFont
			textWrap={textWrap}
		/>
	);
}
