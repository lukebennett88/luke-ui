import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { useActionState } from 'react';

type FormState = {
	errors?: { username?: string };
	values?: { username?: string };
};

const takenUsernames = new Set(['admin', 'root', 'support']);

export default () => {
	const [state, formAction, isPending] = useActionState(createAccount, {});

	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<Form action={formAction} necessityIndicator="required-label" validationErrors={state.errors}>
				<Stack gap="sp16">
					<TextInputField
						defaultValue={state.values?.username}
						isRequired
						label="Username"
						name="username"
					/>
					<Cluster>
						<Button isPending={isPending} type="submit">
							Create account
						</Button>
					</Cluster>
				</Stack>
			</Form>
			<Stack minBlockSize="1.5rem">
				<Text elementType="p" role="status">
					{state.values?.username && !state.errors
						? `Created account for ${state.values.username}.`
						: '\u00a0'}
				</Text>
			</Stack>
		</Stack>
	);
};

async function createAccount(_previous: FormState, formData: FormData): Promise<FormState> {
	await new Promise((resolve) => {
		setTimeout(resolve, 400);
	});

	const usernameValue = formData.get('username');
	const username = typeof usernameValue === 'string' ? usernameValue : '';
	const values = { username };

	if (takenUsernames.has(username.trim().toLowerCase())) {
		return {
			errors: { username: 'That username is taken. Choose another.' },
			values,
		};
	}

	return { values };
}
