import type { DistributiveOmit } from '../../../types.js';
import type { TextProps } from '../primitives/text.js';
import { Text } from '../primitives/text.js';

export interface EmojiProps extends DistributiveOmit<
	TextProps,
	'children' | 'elementType'
> {
	emoji: string;
	label: string;
}

export function Emoji(props: EmojiProps) {
	const { emoji, label, ...textProps } = props;

	return (
		<Text {...textProps} aria-label={label} lineHeight="nospace" role="img">
			{emoji}
		</Text>
	);
}
