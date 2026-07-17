import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { useState } from 'react';

export default function Children() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<LoadingSpinner aria-label="Saving changes" isLoading={isLoading}>
				<Button>Save changes</Button>
			</LoadingSpinner>
			<label>
				<Box alignItems="center" display="flex" gap="200">
					<input
						checked={isLoading}
						onChange={(event) => setIsLoading(event.target.checked)}
						type="checkbox"
					/>
					Saving
				</Box>
			</label>
		</Box>
	);
}
