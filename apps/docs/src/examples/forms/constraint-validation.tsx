import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { TextField } from '@luke-ui/react/text-field';

export default function ConstraintValidation() {
	return (
		<form>
			<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
				<TextField isRequired label="Email address" name="emailAddress" type="email" />
				<Box>
					<Button type="submit">Create account</Button>
				</Box>
			</Box>
		</form>
	);
}
