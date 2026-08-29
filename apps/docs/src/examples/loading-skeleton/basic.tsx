import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="grid" gap="sp16" maxInlineSize="32rem">
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Show loading state
			</Checkbox>
			<Text>
				<LoadingSkeleton isLoading={isLoading}>Three items match your search.</LoadingSkeleton>
			</Text>
		</Box>
	);
};
