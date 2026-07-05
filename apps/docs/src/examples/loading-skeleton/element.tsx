import { Button } from '@luke-ui/react/button';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import type { JSX } from 'react';
import { useState } from 'react';

export const meta = {
	title: 'Loading Skeleton — Element',
	description: 'Skeleton overlay that keeps the wrapped element footprint.',
};

export default function ElementSkeleton(): JSX.Element {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div
			style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '1rem' }}
		>
			<LoadingSkeleton isLoading={isLoading}>
				<Button>Submit</Button>
			</LoadingSkeleton>
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
