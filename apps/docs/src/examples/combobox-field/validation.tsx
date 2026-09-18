import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';
import { Stack } from '@luke-ui/react/stack';
import type { SubmitEvent } from 'react';

const countries = [
	{ id: 'australia', label: 'Australia' },
	{ id: 'canada', label: 'Canada' },
	{ id: 'new-zealand', label: 'New Zealand' },
	{ id: 'united-states', label: 'United States' },
];

export default () => {
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
				<Stack minBlockSize="5.5rem">
					<ComboboxField
						defaultItems={countries}
						isRequired
						label="Work location"
						name="country"
						placeholder="Choose a country"
					>
						{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
					</ComboboxField>
				</Stack>
				<Cluster>
					<Button type="submit">Create account</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
