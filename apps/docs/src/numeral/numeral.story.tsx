import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { NumeralProps } from '@luke-ui/react/numeral';
import { Numeral } from '@luke-ui/react/numeral';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type NumeralStoryProps = Pick<
	NumeralProps,
	'value' | 'format' | 'currency' | 'unit' | 'precision' | 'abbreviate'
>;

function NumeralPlayground(props: NumeralStoryProps) {
	return (
		<StoryWrapper>
			<Numeral {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: NumeralPlayground,
	args: {
		initial: { value: 12345.67 },
	},
});
