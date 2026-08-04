import { TextField } from '@luke-ui/react/text-field';

export default () => {
	return (
		<TextField
			defaultValue="jordan.example"
			errorMessage="Enter an email address in the form you@example.com."
			isInvalid
			label="Email address"
			name="emailAddress"
		/>
	);
};
