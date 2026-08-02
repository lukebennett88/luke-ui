import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import type { FormEvent } from 'react';
import { useState } from 'react';

const countries = [
	{ id: 'australia', label: 'Australia' },
	{ id: 'canada', label: 'Canada' },
	{ id: 'new-zealand', label: 'New Zealand' },
	{ id: 'united-states', label: 'United States' },
];

const INITIAL_EMAIL = '';

interface Submission {
	country: string;
	email: string;
	fullName: string;
	marketing: boolean;
}

function readFormValue(data: FormData, name: string): string {
	const value = data.get(name);
	return typeof value === 'string' ? value : '';
}

export default function BuildAForm() {
	// Controlled, so the submitted summary below can read it. Every other field is uncontrolled.
	const [email, setEmail] = useState(INITIAL_EMAIL);
	const [submission, setSubmission] = useState<Submission | null>(null);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);

		setSubmission({
			country: readFormValue(data, 'country'),
			email: readFormValue(data, 'email'),
			fullName: readFormValue(data, 'fullName'),
			marketing: data.get('marketing') === 'on',
		});
	}

	// The browser already restores every uncontrolled field. Reset the state this form owns itself.
	function handleReset() {
		setEmail(INITIAL_EMAIL);
		setSubmission(null);
	}

	return (
		<Box display="flex" flexDirection="column" gap="600">
			<form onReset={handleReset} onSubmit={handleSubmit}>
				<Box display="flex" flexDirection="column" gap="400" maxInlineSize="22rem">
					<TextField
						description="As it appears on your account."
						isRequired
						label="Full name"
						name="fullName"
					/>
					<TextField
						description="You will receive updates at this address."
						isRequired
						label="Email address"
						name="email"
						onChange={setEmail}
						type="email"
						value={email}
					/>
					<ComboboxField
						defaultItems={countries}
						description="Sets your default currency."
						label="Country"
						name="country"
						placeholder="Choose a country"
					>
						{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
					</ComboboxField>
					<Checkbox description="Occasional product news. No spam." name="marketing">
						Send me product updates
					</Checkbox>
					<Box display="flex" gap="200">
						<Button type="submit">Create account</Button>
						<Button appearance="subtle" type="reset">
							Reset
						</Button>
					</Box>
				</Box>
			</form>
			{submission ? (
				<Text elementType="p">
					Submitted: {submission.fullName || '(no name)'} · {submission.email || '(no email)'} ·{' '}
					{submission.country || '(no country)'} · marketing {submission.marketing ? 'on' : 'off'}.
				</Text>
			) : null}
		</Box>
	);
}
