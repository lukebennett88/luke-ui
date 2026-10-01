import { FieldDescription, FieldError, FieldLabel } from '@luke-ui/react/primitives/field';
import { TextInput, TextInputRoot } from '@luke-ui/react/primitives/text-input';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<TextInputRoot name="example" type="email">
			<Stack gap="sp4" maxInlineSize="20rem">
				<FieldLabel>Example field</FieldLabel>
				<TextInput placeholder="you@example.com" />
				<FieldDescription>Example description.</FieldDescription>
				<FieldError />
			</Stack>
		</TextInputRoot>
	);
};
