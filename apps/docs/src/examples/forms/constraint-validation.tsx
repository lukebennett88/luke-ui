import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';

export default () => {
	return (
		<form>
			<Stack gap="sp16" maxInlineSize="20rem">
				<Stack minBlockSize="5.5rem">
					<TextInputField isRequired label="Email address" name="emailAddress" type="email" />
				</Stack>
				<Cluster>
					<Button type="submit">Create account</Button>
				</Cluster>
			</Stack>
		</form>
	);
};
