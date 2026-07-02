import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { TextProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type TextStoryProps = Pick<
	TextProps,
	| 'children'
	| 'elementType'
	| 'fontSize'
	| 'lineHeight'
	| 'color'
	| 'fontFamily'
	| 'fontWeight'
	| 'textTransform'
	| 'textDecoration'
	| 'lineClamp'
	| 'shouldDisableTrim'
	| 'textAlign'
	| 'variant'
>;

function TextPlayground(props: TextStoryProps) {
	return (
		<StoryWrapper>
			<Text {...props} style={{ display: 'block', inlineSize: '100%' }} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: TextPlayground,
	args: {
		initial: {
			children: 'The quick brown fox jumps over the lazy dog.',
		},
	},
});
