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
			<Stack gap="sp16" maxInlineSize="20rem">
				<Stack minBlockSize="5.5rem">
					<SelectField
						isRequired
						items={countries}
						label="Work location"
						name="workLocation"
						placeholder="Choose a country"
					>
						{(item) => <SelectItem>{item.label}</SelectItem>}
					</SelectField>
				</Stack>
				<Cluster>
					<Button type="submit">Create account</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
