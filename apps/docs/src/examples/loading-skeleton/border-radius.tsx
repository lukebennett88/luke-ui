import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<Checkbox isSelected={isLoading} label="Show loading state" onChange={setIsLoading} />
			<LoadingSkeleton isLoading={isLoading} radius="control">
				<TextInputField label="Email address" name="email" placeholder="you@example.com" />
			</LoadingSkeleton>
		</Stack>
	);
};
