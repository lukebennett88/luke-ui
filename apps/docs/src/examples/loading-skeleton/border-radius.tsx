import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { TextField } from '@luke-ui/react/text-field';
import { useState } from 'react';

export default function BorderRadius() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<LoadingSkeleton isLoading={isLoading} radius="control">
				<TextField label="Email address" name="email" placeholder="you@example.com" />
			</LoadingSkeleton>
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Loading
			</Checkbox>
		</Box>
	);
}
