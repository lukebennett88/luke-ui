import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import type { FormEvent } from 'react';
import { useState } from 'react';

export default () => {
	const [submittedEmail, setSubmittedEmail] = useState('');

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const email = data.get('email');
		setSubmittedEmail(typeof email === 'string' ? email : '');
	}

	return (
		<Stack gap="sp16" maxInlineSize="22rem" inlineSize="100%">
			<form onReset={() => setSubmittedEmail('')} onSubmit={handleSubmit}>
				<Stack gap="sp16">
					<TextField
						description="We will send the receipt to this address."
						isRequired
						label="Email address"
						name="email"
						type="email"
					/>
					<Cluster gap="sp8">
						<Button type="submit">Submit</Button>
						<Button type="reset">Reset</Button>
					</Cluster>
				</Stack>
			</form>
			<Stack minBlockSize="1.5rem">
				<Text elementType="p" role="status">
					{submittedEmail ? `Submitted: ${submittedEmail}` : '\u00a0'}
				</Text>
			</Stack>
		</Stack>
	);
};
