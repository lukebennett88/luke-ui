import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default function TextSkeleton() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<Text>
				<LoadingSkeleton isLoading={isLoading}>
					A short paragraph of placeholder copy that wraps across two lines.
				</LoadingSkeleton>
			</Text>
			<label style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
				<input
					checked={isLoading}
					onChange={(event) => setIsLoading(event.target.checked)}
					type="checkbox"
				/>
				Loading
			</label>
		</div>
	);
}
