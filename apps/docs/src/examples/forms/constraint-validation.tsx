import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { TextField } from '@luke-ui/react/text-field';

export default () => {
	return (
		<form>
			<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
				<Stack minBlockSize="5.5rem">
					<TextField isRequired label="Email address" name="emailAddress" type="email" />
				</Stack>
				<Button type="submit">Create account</Button>
			</Stack>
		</form>
	);
};
