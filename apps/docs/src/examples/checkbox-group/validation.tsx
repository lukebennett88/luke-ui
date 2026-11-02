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
				<CheckboxGroup description="Choose at least one option." isRequired label="Example options">
					<CheckboxField label="First option" value="first" />
					<CheckboxField label="Second option" value="second" />
				</CheckboxGroup>
				<Button type="submit">Submit</Button>
			</Stack>
		</form>
	);
};
