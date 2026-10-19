import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import type { SubmitEvent } from 'react';
import { useState } from 'react';

export default () => {
	const [submitted, setSubmitted] = useState('');

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const familyName = data.get('familyName');
		setSubmitted(typeof familyName === 'string' ? familyName : '');
	}

	return (
		<Stack gap="space.16" maxInlineSize="20rem">
			<Form necessityIndicator="optional-label" onSubmit={handleSubmit}>
				<Stack gap="space.16">
					<Text elementType="p">All fields are required unless marked optional.</Text>
					<TextInputField isRequired label="Family name" name="familyName" />
					<TextInputField label="Middle name" name="middleName" />
					<Cluster>
						<Button type="submit">Save</Button>
					</Cluster>
				</Stack>
			</Form>
			<Text elementType="p" isVisuallyHidden={!submitted} role="status">
				{submitted ? `Submitted: ${submitted}` : null}
			</Text>
		</Stack>
	);
};
