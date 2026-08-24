import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
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
			<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
				<TextField
					defaultValue="admin"
					label="Username"
					name="username"
					validate={validateUsername}
				/>
				<Box>
					<Button type="submit">Create account</Button>
				</Box>
			</Box>
		</form>
	);
};
