import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';
import { em } from './styles.css.js';

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
	const { className, lineClamp, textWrap, ...elementProps } = props;
	return (
		<Text
			{...elementProps}
			className={cx(em, className)}
			elementType="em"
			lineClamp={lineClamp}
			shouldInheritFont
			textWrap={textWrap}
		/>
	);
}
