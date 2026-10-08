import type { TextProps } from '../text/text.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

interface EmStyleProps {
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

type _EmOmit = DistributiveOmit<React.ComponentProps<'em'>, 'color' | 'slot'>;

interface _EmProps extends _EmOmit, EmStyleProps {}

/** Props for the `Em` component. */
export type EmProps = Prettify<_EmProps>;

/**
 * Marks text to stress emphasis, rendered as `<em>`.
 * Inherits surrounding typography and applies italic styling.
 *
 * It never fills a React Aria text slot, so it renders inside a field's label, description, or
 * error message.
 */
export function Em(props: EmProps) {
	const { lineClamp, textWrap, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			elementType="em"
			fontStyle="italic"
			lineClamp={lineClamp}
			shouldInheritFont
			slot={null}
			textWrap={textWrap}
		/>
	);
}
