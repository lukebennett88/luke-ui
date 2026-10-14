import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';

export default () => {
	return (
		<Form necessityIndicator="required-label">
			<Stack gap="sp16" maxInlineSize="20rem">
				<TextInputField isRequired label="Email address" name="emailAddress" type="email" />
				<Cluster>
					<Button type="submit">Create account</Button>
				</Cluster>
			</Stack>
		</Form>
	);
};
