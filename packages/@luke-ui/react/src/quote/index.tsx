import { Text } from '../text/index.js';
import type { TextProps } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

interface QuoteStyleProps {
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

type _QuoteOmit = DistributiveOmit<React.ComponentProps<'q'>, 'color'>;

interface _QuoteProps extends _QuoteOmit, QuoteStyleProps {}

/**
 * Props for the `Quote` component.
 *
 * @tier atom
 */
export type QuoteProps = Prettify<_QuoteProps>;

/**
 * Short inline quotation, rendered as `<q>`.
 * Composes `Text` and inherits surrounding typography.
 */
export function Quote(props: QuoteProps) {
	const { lineClamp, textWrap, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			elementType="q"
			lineClamp={lineClamp}
			shouldInheritFont
			textWrap={textWrap}
		/>
	);
}
