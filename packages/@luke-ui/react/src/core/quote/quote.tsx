import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

interface QuoteStyleProps {
	/**
	 * Clamps text lines. `true` clamps to 1 line; numeric values clamp to 1–5.
	 */
	lineClamp?: TextProps['lineClamp'];
	/**
	 * Sets text wrapping behavior.
	 * @default 'default'
	 */
	textWrap?: TextProps['textWrap'];
}

type _QuoteOmit = DistributiveOmit<React.ComponentProps<'q'>, 'cite' | 'color' | 'slot'>;

interface _QuoteProps extends _QuoteOmit, QuoteStyleProps {
	/** URL of the quoted source. */
	cite?: React.ComponentProps<'q'>['cite'];
}

/** Props for the `Quote` component. */
export type QuoteProps = Prettify<_QuoteProps>;

/**
 * Short inline quotation, rendered as `<q>`.
 * Inherits surrounding typography.
 *
 * It never fills a React Aria text slot, so it renders inside a field's label, description, or
 * error message.
 */
export function Quote(props: QuoteProps) {
	const { lineClamp, textWrap, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			elementType="q"
			lineClamp={lineClamp}
			shouldInheritFont
			slot={null}
			textWrap={textWrap}
		/>
	);
}
