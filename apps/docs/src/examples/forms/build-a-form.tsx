import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import type { FormEvent } from 'react';
import { useState } from 'react';

export default function BuildAForm() {
	const [submittedEmail, setSubmittedEmail] = useState('');

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const email = data.get('email');
		setSubmittedEmail(typeof email === 'string' ? email : '');
	}

	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="22rem">
			<form onReset={() => setSubmittedEmail('')} onSubmit={handleSubmit}>
				<Box display="flex" flexDirection="column" gap="400">
					<TextField
						description="We will send the receipt to this address."
						isRequired
						label="Email address"
						name="email"
						type="email"
					/>
					<Box display="flex" gap="200">
						<Button type="submit">Submit</Button>
						<Button appearance="subtle" type="reset">
							Reset
						</Button>
					</Box>
				</Box>
			</form>
			{submittedEmail ? <Text elementType="p">Submitted: {submittedEmail}</Text> : null}
		</Box>
	);
}
