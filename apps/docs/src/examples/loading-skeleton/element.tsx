import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { useState } from 'react';

export default function ElementSkeleton() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div
			style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '1rem' }}
		>
			<ul>
				<LoadingSkeleton elementType="li" isLoading={isLoading}>
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
