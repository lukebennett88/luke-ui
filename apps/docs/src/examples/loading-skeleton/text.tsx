import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import type { JSX } from 'react';
import { useState } from 'react';

export const meta = {
	title: 'Loading Skeleton — Text',
	description: 'Inline skeleton that mirrors the wrapped text size.',
};

export default function TextSkeleton(): JSX.Element {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<LoadingSkeleton isLoading={isLoading}>
				A short paragraph of placeholder copy that wraps across two lines.
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
