import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import type { SubmitEvent } from 'react';

function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
	event.preventDefault();
}

export default () => {
	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="space.16" maxInlineSize="20rem">
				<CheckboxField isRequired label="Example checkbox" />
				<Cluster>
					<Button type="submit">Submit</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
