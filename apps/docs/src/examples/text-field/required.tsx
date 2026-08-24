import { Box } from '@luke-ui/react/box';
import { TextField } from '@luke-ui/react/text-field';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
			<TextField isRequired label="First name" name="firstName" necessityIndicator="icon" />
			<TextField isRequired label="Last name" name="lastName" necessityIndicator="label" />
		</Box>
	);
};
