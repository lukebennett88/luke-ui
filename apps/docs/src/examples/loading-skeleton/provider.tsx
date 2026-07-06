import { Button } from '@luke-ui/react/button';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import type { JSX } from 'react';
import { useState } from 'react';

export default function ProviderSkeleton(): JSX.Element {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<LoadingSkeletonProvider isLoading={isLoading}>
				<Text>
					<LoadingSkeleton isLoading={false}>Ada Lovelace</LoadingSkeleton>
				</Text>
				<LoadingSkeleton isLoading={false}>
					<Button>Edit profile</Button>
				</LoadingSkeleton>
			</LoadingSkeletonProvider>
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
