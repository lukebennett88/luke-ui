import { TextField } from '@luke-ui/react/text-field';

export default function Basic() {
	return (
		<TextField
			description="We'll only use this for account updates."
			label="Email"
			name="email"
			placeholder="name@example.com"
		/>
	);
}
