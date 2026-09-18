import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Stack } from '@luke-ui/react/stack';
import { TextField } from '@luke-ui/react/text-field';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Show loading state
			</Checkbox>
			<LoadingSkeleton isLoading={isLoading} radius="control">
				<TextField label="Email address" name="email" placeholder="you@example.com" />
			</LoadingSkeleton>
		</Stack>
	);
};
