import type { DistributiveOmit } from '../../../types.js';
import type { TextProps } from '../primitives/text.js';
import { Text } from '../primitives/text.js';

/** Props for `Emoji`. */
export interface EmojiProps extends DistributiveOmit<TextProps, 'children' | 'elementType'> {
	/** Emoji character to render. */
	emoji: string;
	/** Accessible label announced by screen readers. */
	label: string;
}

/** Text wrapper for accessible emoji output. */
export function Emoji(props: EmojiProps) {
	const { emoji, label, ...textProps } = props;

	return (
		<Text {...textProps} aria-label={label} lineHeight="nospace" role="img">
			{emoji}
		</Text>
	);
}
