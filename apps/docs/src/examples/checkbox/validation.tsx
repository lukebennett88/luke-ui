import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import type { SubmitEvent } from 'react';

export default () => {
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<form onSubmit={handleSubmit}>
			<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
				<Checkbox description="We record the date you accepted." isRequired>
					I accept the terms of service
				</Checkbox>
				<Box>
					<Button type="submit">Create account</Button>
				</Box>
			</Box>
		</form>
	);
};
