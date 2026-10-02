import { FieldDescription, FieldError, FieldLabel } from '@luke-ui/react/primitives/field';
import { TextInput, TextInputRoot } from '@luke-ui/react/primitives/text-input';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<TextInputRoot name="email" type="email">
			<Stack gap="sp4" maxInlineSize="20rem">
				<FieldLabel>Email address</FieldLabel>
				<TextInput placeholder="you@example.com" />
				<FieldDescription>We send receipts to this address.</FieldDescription>
				<FieldError />
			</Stack>
		</TextInputRoot>
	);
};
