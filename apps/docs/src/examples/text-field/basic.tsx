import { TextField } from '@luke-ui/react/text-field';
import type { JSX } from 'react';

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
