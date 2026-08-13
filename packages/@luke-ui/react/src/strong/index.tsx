import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';
import { strong } from './styles.css.js';

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
	const { className, lineClamp, textWrap, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			className={cx(strong, className)}
			elementType="strong"
			lineClamp={lineClamp}
			shouldInheritFont
			textWrap={textWrap}
		/>
	);
}
