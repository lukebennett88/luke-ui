import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';

export default () => (
	<Form controlSize="small">
		<Stack gap="sp16">
			<TextInputField label="Name" />
			<CheckboxField label="Subscribe" />
			<Button size="medium">Save</Button>
		</Stack>
	</Form>
);
