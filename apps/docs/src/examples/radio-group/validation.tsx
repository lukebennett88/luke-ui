import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Stack } from '@luke-ui/react/stack';
import type { SubmitEvent } from 'react';

function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
	event.preventDefault();
}

export default () => {
	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="space.16">
				<RadioGroup isRequired label="Text alignment" name="alignment">
					<RadioField label="Left" value="left" />
					<RadioField label="Centre" value="centre" />
					<RadioField label="Right" value="right" />
				</RadioGroup>
				<Cluster>
					<Button type="submit">Submit</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
