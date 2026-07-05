import { Heading } from '@luke-ui/react/heading';
import type { JSX } from 'react';

export const meta = {
	title: 'Heading — Typography',
	description: 'Heading color and font weight can be customized with Text props.',
};

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
