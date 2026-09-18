import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { TextField } from '@luke-ui/react/text-field';
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
		<form onSubmit={handleSubmit}>
			<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
				<Stack minBlockSize="5.5rem">
					<TextField
						defaultValue="admin"
						label="Username"
						name="username"
						validate={validateUsername}
					/>
				</Stack>
				<Button type="submit">Create account</Button>
			</Stack>
		</form>
	);
};
