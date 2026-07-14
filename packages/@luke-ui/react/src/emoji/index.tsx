import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';

/**
 * Props for `Emoji`.
 *
 * @tier atom
 */
export interface EmojiProps extends DistributiveOmit<TextProps, 'children' | 'elementType'> {
	/** Emoji character to render. */
	emoji: string;
	/** Accessible label announced by screen readers. */
	label: string;
}

/** Accessible emoji output with the same typography props as `Text`. */
export function Emoji(props: EmojiProps) {
	const { emoji, label, ...textProps } = props;

	return (
		<Text {...textProps} aria-label={label} role="img">
			{emoji}
		</Text>
	);
}
