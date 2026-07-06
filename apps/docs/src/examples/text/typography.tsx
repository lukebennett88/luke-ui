import { Text } from '@luke-ui/react/text';
import type { JSX } from 'react';

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
