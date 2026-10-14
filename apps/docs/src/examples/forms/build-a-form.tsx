import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { useActionState } from 'react';

export default () => {
	const [submittedEmail, formAction, isPending] = useActionState(submitEmail, '');

	return (
		<Stack gap="sp16" maxInlineSize="22rem">
			<Form action={formAction} necessityIndicator="required-label">
				<Stack gap="sp16">
					<TextInputField
						description="We will send the receipt to this address."
						isRequired
						label="Email address"
						name="email"
						type="email"
					/>
					<Cluster gap="sp8">
						<Button isPending={isPending} type="submit">
							Submit
						</Button>
					</Cluster>
				</Stack>
			</Form>
			<Stack minBlockSize="1.5rem">
				<Text elementType="p" role="status">
					{submittedEmail ? `Submitted: ${submittedEmail}` : '\u00a0'}
				</Text>
			</Stack>
		</Stack>
	);
};

async function submitEmail(_previous: string, formData: FormData) {
	const email = formData.get('email');
	return typeof email === 'string' ? email : '';
}
