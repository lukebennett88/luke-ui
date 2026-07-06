import { Text } from '@luke-ui/react/text';
import type { JSX } from 'react';

export default function Alignment(): JSX.Element {
	return (
		<Text textAlign="end" fontVariantNumeric="tabular-nums" style={{ display: 'block' }}>
			12121.21
		</Text>
	);
}
