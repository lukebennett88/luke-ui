import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Stack } from '@luke-ui/react/stack';
import type { SubmitEvent } from 'react';

export default () => {
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<Form onSubmit={handleSubmit}>
			<Stack gap="sp16" maxInlineSize="20rem">
				<fieldset style={{ border: 'none', margin: 0, minInlineSize: 0, padding: 0 }}>
					<legend>Email notifications</legend>
					<Stack gap="sp12" paddingBlockStart="sp12">
						<CheckboxField defaultSelected label="Product updates" name="productUpdates" />
						<CheckboxField defaultSelected label="Security alerts" name="securityAlerts" />
						<CheckboxField label="Tips and tutorials" name="tips" />
					</Stack>
				</fieldset>
				<Cluster>
					<Button type="submit">Save preferences</Button>
				</Cluster>
			</Stack>
		</Form>
	);
};
