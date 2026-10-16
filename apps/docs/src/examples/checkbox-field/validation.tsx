import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import type { SubmitEvent } from 'react';

export default () => {
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="sp16" maxInlineSize="20rem">
				<CheckboxField isRequired label="Example checkbox" />
				<Cluster>
					<Button type="submit">Submit</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
