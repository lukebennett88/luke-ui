import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';
import type { SubmitEvent } from 'react';

const reservedUsernames = new Set(['admin', 'root', 'support']);

function validateUsername(value: string): string | null {
	if (reservedUsernames.has(value.trim().toLowerCase())) {
		return 'That username is reserved. Choose another.';
	}

	return null;
}

export default () => {
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<Form onSubmit={handleSubmit}>
			<Stack gap="sp16" maxInlineSize="20rem">
				<TextInputField
					defaultValue="admin"
					label="Username"
					name="username"
					validate={validateUsername}
				/>
				<Cluster>
					<Button type="submit">Create account</Button>
				</Cluster>
			</Stack>
		</Form>
	);
};
