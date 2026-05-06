import { createStoryClient } from '@fumadocs/story/client';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import type { story } from './combobox-field.story';

export const storyClient = createStoryClient<typeof story>({
	Component: ComboboxField,
});
