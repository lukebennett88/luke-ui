import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<ScrollFade
			aria-label="Example items"
			axis="block"
			padding="space.12"
			style={{ blockSize: '8.75rem', inlineSize: '20rem' }}
		>
			<Stack gap="space.12">
				{['First item', 'Second item', 'Third item', 'Fourth item', 'Fifth item', 'Sixth item'].map(
					(item) => (
						<Text key={item}>{item}</Text>
					),
				)}
			</Stack>
		</ScrollFade>
	);
};
