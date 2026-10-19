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
		<Stack gap="space.16" maxInlineSize="20rem">
			<Form action={formAction} necessityIndicator="required-label">
				<Stack gap="space.16">
					<TextInputField
						description="We will send the receipt to this address."
						isRequired
						label="Email address"
						name="email"
						type="email"
					/>
					<Cluster gap="space.8">
						<Button isPending={isPending} type="submit">
							Send receipt
						</Button>
					</Cluster>
				</Stack>
			</Form>
			<Text elementType="p" isVisuallyHidden={!submittedEmail} role="status">
				{submittedEmail ? `Receipt sent to ${submittedEmail}.` : null}
			</Text>
		</Stack>
	);
};

async function submitEmail(_previous: string, formData: FormData) {
	const email = formData.get('email');
	return typeof email === 'string' ? email : '';
}
