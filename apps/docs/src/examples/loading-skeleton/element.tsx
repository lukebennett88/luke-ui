import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import type { JSX } from 'react';
import { useState } from 'react';

export const meta = {
	title: 'Loading Skeleton — Element',
	description: 'Render the skeleton as a different element to match the surrounding markup.',
};

export default function ElementSkeleton(): JSX.Element {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div
			style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '1rem' }}
		>
			<ul>
				<LoadingSkeleton as="li" isLoading={isLoading}>
					List item placeholder
				</LoadingSkeleton>
			</ul>
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
