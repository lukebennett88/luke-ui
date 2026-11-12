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
			<Stack gap="space.16">
				<CheckboxGroup label="Consent" name="consent">
					<CheckboxField isRequired label="I accept the terms" value="terms" />
					<CheckboxField label="Email me updates" value="updates" />
				</CheckboxGroup>
				<Button type="submit">Submit</Button>
			</Stack>
		</form>
	);
};
