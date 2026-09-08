import { isWrappingLineClamp } from '../text/line-clamp.js';
import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { codeRecipe } from './recipe.css.js';

interface CodeStyleProps {
	/**
	 * Clamps the text to a number of lines. `true` clamps to 1 line; a number clamps to 1–5. A value
	 * of 2 or more allows wrapping. A single-line clamp wins over `textWrap`.
	 */
	lineClamp?: TextProps['lineClamp'];
	/**
	 * Sets text wrapping. `'balance'` and `'pretty'` wrap across lines unless `lineClamp` clamps to
	 * a single line.
	 * @default 'default'
	 */
	textWrap?: TextProps['textWrap'];
}

type _CodeOmit = DistributiveOmit<React.ComponentProps<'code'>, 'color'>;

interface _CodeProps extends _CodeOmit, CodeStyleProps {}

/** Props for the `Code` component. */
export type CodeProps = Prettify<_CodeProps>;

/**
 * Marks a short fragment of computer code as `<code>`. Inherits surrounding size and colour,
 * applies the code font with an optical size correction, and stays on one line unless `lineClamp`
 * or `textWrap` wraps it.
 */
export function Code(props: CodeProps) {
	const { className, lineClamp, textWrap, ...elementProps } = props;
	// `codeRecipe` emits `white-space: nowrap` after `textRecipe`. Drop it when Text should wrap.
	const shouldWrap =
		isWrappingLineClamp(lineClamp) || (textWrap !== undefined && textWrap !== 'default');

	return (
		<Text
			{...elementProps}
			className={codeRecipe({ className, shouldWrap })}
			elementType="code"
			lineClamp={lineClamp}
			shouldInheritFont
			textWrap={textWrap}
		/>
	);
}
