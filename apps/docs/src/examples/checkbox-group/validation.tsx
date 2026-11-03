import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { Stack } from '@luke-ui/react/stack';
import type { SubmitEvent } from 'react';

function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
	event.preventDefault();
}

export default () => {
	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="space.16" maxInlineSize="20rem">
				<CheckboxGroup
					description="Choose at least one day."
					isRequired
					label="Days available"
					name="days"
				>
					<CheckboxField label="Monday" value="monday" />
					<CheckboxField label="Tuesday" value="tuesday" />
					<CheckboxField label="Wednesday" value="wednesday" />
				</CheckboxGroup>
				<Button type="submit">Submit</Button>
			</Stack>
		</form>
	);
};
