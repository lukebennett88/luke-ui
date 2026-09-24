import { Box } from '@luke-ui/react/box';
import { ScrollMask } from '@luke-ui/react/scroll-mask';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<ScrollMask aria-label="Example items" inlineSize="16rem" padding="sp12">
			<Box display="flex" gap="sp16">
				{['First item', 'Second item', 'Third item', 'Fourth item'].map((item) => (
					<Text key={item} style={{ flex: 'none' }}>
						{item}
					</Text>
				))}
			</Box>
		</ScrollMask>
	);
};
