import { TextField } from '@luke-ui/react/text-field';
import type { JSX } from 'react';

export const meta = {
	title: 'Text Field — Basic',
	description: 'Single-line text input with label and description.',
};

export default function Basic(): JSX.Element {
	return (
		<TextField
			name="email"
			label="Email"
			description="We'll only use this for account updates."
			placeholder="name@example.com"
		/>
	);
}
