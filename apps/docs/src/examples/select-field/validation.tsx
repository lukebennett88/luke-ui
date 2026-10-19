import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Stack } from '@luke-ui/react/stack';
import type { SubmitEvent } from 'react';

const countries = [
	{ id: 'australia', label: 'Australia' },
	{ id: 'canada', label: 'Canada' },
	{ id: 'new-zealand', label: 'New Zealand' },
];

export default () => {
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="space.16" maxInlineSize="20rem">
				<SelectField
					isRequired
					items={countries}
					label="Country"
					name="country"
					placeholder="Choose a country"
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
				<Cluster>
					<Button type="submit">Submit</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
