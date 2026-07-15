import type { TextProps } from '../text/index.js';
import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _EmojiOmit = DistributiveOmit<TextProps, 'children' | 'elementType'>;
interface _EmojiProps extends _EmojiOmit {
	/** Emoji character to render. */
	emoji: string;
	/** Accessible label announced by screen readers. */
	label: string;
}

/**
 * Props for `Emoji`.
 *
 * @tier atom
 */
export type EmojiProps = Prettify<_EmojiProps>;

/** Accessible emoji output with the same typography props as `Text`. */
export function Emoji(props: EmojiProps) {
	const { emoji, label, ...textProps } = props;

	return (
		<Text {...textProps} aria-label={label} role="img">
			{emoji}
		</Text>
	);
}
