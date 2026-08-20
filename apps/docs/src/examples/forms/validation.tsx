import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';
import { TextField } from '@luke-ui/react/text-field';
import type { SubmitEvent } from 'react';
import { useState } from 'react';

const countries = [
	{ id: 'australia', label: 'Australia' },
	{ id: 'canada', label: 'Canada' },
	{ id: 'new-zealand', label: 'New Zealand' },
	{ id: 'united-states', label: 'United States' },
];

type Errors = { country?: string; email?: string; terms?: string };

export default () => {
	const [errors, setErrors] = useState<Errors>({});

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const emailValue = data.get('emailAddress');
		const email = typeof emailValue === 'string' ? emailValue : '';

		setErrors({
			country: data.get('country') ? undefined : 'Choose the country where you work.',
			email: email.includes('@')
				? undefined
				: 'Enter an email address in the form you@example.com.',
			terms: data.get('terms') ? undefined : 'Accept the terms of service before you continue.',
		});
	}

	return (
		<form noValidate onSubmit={handleSubmit}>
			<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
				<TextField
					errorMessage={errors.email}
					label="Email address"
					name="emailAddress"
					placeholder="you@example.com"
				/>
				<ComboboxField
					defaultItems={countries}
					errorMessage={errors.country}
					label="Work location"
					name="country"
					placeholder="Choose a country"
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
				<Checkbox errorMessage={errors.terms} name="terms">
					I accept the terms of service
				</Checkbox>
				<Box>
					<Button type="submit">Create account</Button>
				</Box>
			</Box>
		</form>
	);
};
