import { Text } from '@luke-ui/react/text';
import type { JSX } from 'react';

export const meta = {
	title: 'Text — Transform and decoration',
	description: 'Apply text transform and decoration to emphasize content.',
};

export default function Transform(): JSX.Element {
	return (
		<Text textTransform="uppercase" textDecoration="underline">
			Emphasized text
		</Text>
	);
}
