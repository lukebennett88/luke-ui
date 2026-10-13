import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<TextInputField
				isRequired
				label="First name"
				name="firstName"
				necessityIndicator="required-asterisk"
			/>
			<TextInputField
				isRequired
				label="Last name"
				name="lastName"
				necessityIndicator="required-label"
			/>
			<TextInputField label="Middle name" name="middleName" necessityIndicator="optional-label" />
		</Stack>
	);
};
