import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';
import type { SubmitEvent } from 'react';

function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
	event.preventDefault();
}

export default () => {
	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="space.16" maxInlineSize="20rem">
				<TextInputField isRequired label="Email address" name="emailAddress" type="email" />
				<Cluster>
					<Button type="submit">Submit</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
