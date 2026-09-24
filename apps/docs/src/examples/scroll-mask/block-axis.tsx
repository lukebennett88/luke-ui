import { ScrollMask } from '@luke-ui/react/scroll-mask';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<ScrollMask
			aria-label="Example items"
			axis="block"
			blockSize="8.75rem"
			inlineSize="20rem"
			padding="sp12"
		>
			<Stack gap="sp12">
				{['First item', 'Second item', 'Third item', 'Fourth item', 'Fifth item', 'Sixth item'].map(
					(item) => (
						<Text key={item}>{item}</Text>
					),
				)}
			</Stack>
		</ScrollMask>
	);
};
