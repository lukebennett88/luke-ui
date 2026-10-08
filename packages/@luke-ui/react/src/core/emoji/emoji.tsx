import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _EmojiOmit = DistributiveOmit<
	React.ComponentProps<'span'>,
	'aria-label' | 'children' | 'color' | 'role' | 'slot'
>;

interface _EmojiProps extends _EmojiOmit {
	/** Emoji character to render. */
	emoji: string;
	/** Accessible label announced by screen readers. */
	label: string;
}

/** Props for `Emoji`. */
export type EmojiProps = Prettify<_EmojiProps>;

/**
 * Accessible emoji that inherits surrounding font styles. Wrap it in `Text` when it needs a
 * specific typography treatment.
 *
 * It never fills a React Aria text slot, so it renders inside a field's label, description, or
 * error message.
 */
export function Emoji(props: EmojiProps) {
	const { emoji, label, ...elementProps } = props;

	return (
		<Text {...elementProps} aria-label={label} role="img" shouldInheritFont slot={null}>
			{emoji}
		</Text>
	);
}
