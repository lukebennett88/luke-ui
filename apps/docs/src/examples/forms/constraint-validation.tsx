import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { TextField } from '@luke-ui/react/text-field';

export default () => {
	return (
		<form>
			<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
				<Stack minBlockSize="5.5rem">
					<TextField isRequired label="Email address" name="emailAddress" type="email" />
				</Stack>
				<Cluster>
					<Button type="submit">Create account</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
