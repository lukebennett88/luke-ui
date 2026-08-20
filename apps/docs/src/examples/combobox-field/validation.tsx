import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';
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
			<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
				<ComboboxField
					defaultItems={countries}
					isRequired
					label="Work location"
					name="country"
					placeholder="Choose a country"
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
				<Box>
					<Button type="submit">Create account</Button>
				</Box>
			</Box>
		</form>
	);
};
