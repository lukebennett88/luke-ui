import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { TextFieldProps } from '@luke-ui/react/text-field';
import { TextField } from '@luke-ui/react/text-field';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type TextFieldStoryProps = Pick<
	TextFieldProps,
	'name' | 'label' | 'description' | 'placeholder' | 'size' | 'isRequired'
>;

function TextFieldPlayground(props: TextFieldStoryProps) {
	return (
		<StoryWrapper>
			<TextField {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: TextFieldPlayground,
	args: {
		initial: { label: 'Email', name: 'email' },
	},
});
