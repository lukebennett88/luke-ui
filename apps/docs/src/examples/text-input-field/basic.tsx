import { TextInputField } from '@luke-ui/react/text-input-field';

export default () => {
	return (
		<TextInputField
			description="Use the address you check most often."
			label="Email address"
			name="emailAddress"
			placeholder="you@example.com"
		/>
	);
};
