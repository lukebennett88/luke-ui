import { Heading } from '@luke-ui/react/heading';
import type { JSX } from 'react';

export default function Typography(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Heading level={3} color="informative">
				Informative heading
			</Heading>
			<Heading level={4} fontWeight="regular">
				Light-weight heading
			</Heading>
		</div>
	);
}
