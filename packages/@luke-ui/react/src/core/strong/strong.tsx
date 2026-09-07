import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

interface StrongStyleProps {
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

type _StrongOmit = DistributiveOmit<React.ComponentProps<'strong'>, 'color'>;

interface _StrongProps extends _StrongOmit, StrongStyleProps {}

/** Props for the `Strong` component. */
export type StrongProps = Prettify<_StrongProps>;

/**
 * Marks text with strong importance, rendered as `<strong>`.
 * Inherits surrounding typography and applies the emphasis weight.
 */
export function Strong(props: StrongProps) {
	const { lineClamp, textWrap, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			elementType="strong"
			fontWeight="emphasis"
			lineClamp={lineClamp}
			shouldInheritFont
			textWrap={textWrap}
		/>
	);
}
