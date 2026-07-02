import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { ComboboxFieldProps } from '@luke-ui/react/combobox-field';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type Item = { id: string; label: string };

const items: Array<Item> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
];

type ComboboxFieldStoryProps = Pick<
	ComboboxFieldProps<Item>,
	'label' | 'name' | 'placeholder' | 'description' | 'isRequired' | 'isDisabled' | 'size'
>;

function ComboboxFieldPlayground(props: ComboboxFieldStoryProps) {
	return (
		<StoryWrapper>
			<ComboboxField defaultItems={items} {...props}>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: ComboboxFieldPlayground,
	args: {
		initial: { label: 'Country', name: 'country', placeholder: 'Select a country...' },
	},
});
