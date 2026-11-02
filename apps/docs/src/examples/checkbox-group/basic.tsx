import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<Stack maxInlineSize="20rem">
			<CheckboxGroup description="Choose any options that apply." label="Example options">
				<CheckboxField label="First option" value="first" />
				<CheckboxField label="Second option" value="second" />
			</CheckboxGroup>
		</Stack>
	);
};
