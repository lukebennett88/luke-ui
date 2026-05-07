import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { ComboboxFieldStoryProps, story } from './combobox-field.story';

type Item = { id: string; label: string };

const items: Array<Item> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
];

function ComboboxFieldStory<T extends object>(props: ComboboxFieldStoryProps<T>) {
	return (
		<ComboboxField defaultItems={items} {...props}>
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>
	);
}

export const storyClient = createWrappedStoryClient<typeof story>(ComboboxFieldStory);
