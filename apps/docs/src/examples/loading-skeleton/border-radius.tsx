import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { TextField } from '@luke-ui/react/text-field';
import type { JSX } from 'react';
import { useState } from 'react';

export const meta = {
	title: 'Loading Skeleton — Border radius',
	description: 'Override the skeleton corner radius for wrapped controls.',
};

export default function BorderRadius(): JSX.Element {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<LoadingSkeleton borderRadius="0.25rem" isLoading={isLoading}>
				<TextField label="Email" name="email" />
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
