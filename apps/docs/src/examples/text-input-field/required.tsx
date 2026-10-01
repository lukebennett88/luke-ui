import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<TextInputField isRequired label="First name" name="firstName" necessityIndicator="icon" />
			<TextInputField isRequired label="Last name" name="lastName" necessityIndicator="label" />
		</Stack>
	);
};
