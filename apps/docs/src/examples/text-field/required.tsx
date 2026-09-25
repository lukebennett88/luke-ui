import { Stack } from '@luke-ui/react/stack';
import { TextField } from '@luke-ui/react/text-field';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<TextField isRequired label="First name" name="firstName" necessityIndicator="icon" />
			<TextField isRequired label="Last name" name="lastName" necessityIndicator="label" />
		</Stack>
	);
};
