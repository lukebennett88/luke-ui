import { Text } from '@luke-ui/react/text';
import type { JSX } from 'react';

export const meta = {
	title: 'Text — Typography',
	description: 'Use font size, color, font family, and weight tokens to style text.',
};

export default function Typography(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Text fontSize="h2" lineHeight="tight">
				Heading-like text
			</Text>
			<Text color="critical" fontFamily="mono" fontWeight="bold">
				Alert-like inline text
			</Text>
		</div>
	);
}
