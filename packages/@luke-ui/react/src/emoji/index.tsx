import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _EmojiOmit = DistributiveOmit<
	React.ComponentProps<'span'>,
	'aria-label' | 'children' | 'color' | 'role'
>;

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

/**
 * Accessible emoji that inherits surrounding font styles. Wrap it in `Text` when it needs a
 * specific typography treatment.
 */
export function Emoji(props: EmojiProps) {
	const { className, emoji, label, ...elementProps } = props;

	return (
		<Text {...elementProps} aria-label={label} className={className} role="img" shouldInheritFont>
			{emoji}
		</Text>
	);
}
