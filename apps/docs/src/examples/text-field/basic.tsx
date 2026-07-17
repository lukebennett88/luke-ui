import { TextField } from '@luke-ui/react/text-field';

export default function Basic() {
	return (
		<TextField
			description="Use the address you check most often."
			label="Email address"
			name="emailAddress"
			placeholder="you@example.com"
		/>
	);
}
