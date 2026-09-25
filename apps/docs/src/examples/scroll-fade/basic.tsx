import { Box } from '@luke-ui/react/box';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<ScrollFade aria-label="Example items" inlineSize="16rem" padding="sp12">
			<Box display="flex" gap="sp16">
				{['First item', 'Second item', 'Third item', 'Fourth item'].map((item) => (
					<Text key={item} style={{ flex: 'none' }}>
						{item}
					</Text>
				))}
			</Box>
		</ScrollFade>
	);
};
