import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import type { JSX } from 'react';
import { useState } from 'react';

export const meta = {
	title: 'Loading Skeleton — Custom dimensions',
	description: 'Wrap an element with explicit dimensions for a fixed-shape placeholder.',
};

export default function CustomDimensions(): JSX.Element {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div
			style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '1rem' }}
		>
			<LoadingSkeleton isLoading={isLoading}>
				<div style={{ borderRadius: '9999px', height: '3rem', width: '3rem' }} />
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
