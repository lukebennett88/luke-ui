import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { TextField } from '@luke-ui/react/text-field';
import { useState } from 'react';

export default function BorderRadius() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<LoadingSkeleton isLoading={isLoading} radius="control">
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
