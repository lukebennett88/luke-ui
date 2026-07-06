import { Text } from '@luke-ui/react/text';
import type { JSX } from 'react';

export default function Transform(): JSX.Element {
	return (
		<Text textTransform="uppercase" textDecoration="underline">
			Emphasized text
		</Text>
	);
}
