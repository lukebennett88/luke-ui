import { isWrappingLineClamp } from '../text/line-clamp.js';
import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { codeRecipe } from './recipe.css.js';

interface CodeStyleProps {
	/**
	 * Clamps text lines. `true` clamps to 1 line; numeric values clamp to 1–5. A value of 2 or
	 * more allows the text to wrap so it can span multiple lines. Clamping to a single line keeps
	 * the text on one line even when `textWrap` asks it to wrap.
	 */
	lineClamp?: TextProps['lineClamp'];
	/**
	 * Sets text wrapping behavior. Setting this to `'balance'` or `'pretty'` allows the text to
	 * wrap across multiple lines, unless `lineClamp` clamps it to a single line.
	 * @default 'default'
	 */
	textWrap?: TextProps['textWrap'];
}

type _CodeOmit = DistributiveOmit<React.ComponentProps<'code'>, 'color'>;

interface _CodeProps extends _CodeOmit, CodeStyleProps {}

/** Props for the `Code` component. */
export type CodeProps = Prettify<_CodeProps>;

/**
 * Marks a short fragment of computer code, rendered as `<code>`.
 * Inherits surrounding typography and colour, and applies the code font family with an optical
 * size correction. Stays on one line unless `lineClamp` or `textWrap` needs the text to wrap.
 * Clamping to a single line wins over `textWrap`, so the text stays on one truncated line.
 */
export function Code(props: CodeProps) {
	const { className, lineClamp, textWrap, ...elementProps } = props;
	// `codeRecipe`'s own `white-space: nowrap` is what keeps inline code on one line by default.
	// It is emitted after `textRecipe`, so it must step aside whenever anything asks the text to
	// wrap and let `Text` resolve the rest. Clamping to a single line still wins over `textWrap`
	// there, so that tie is not restated here.
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
