import { Cluster } from '@luke-ui/react/cluster';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<ScrollFade aria-label="Example items" padding="space.12" style={{ inlineSize: '16rem' }}>
			<Cluster flexWrap="nowrap" gap="space.16">
				{['First item', 'Second item', 'Third item', 'Fourth item'].map((item) => (
					<Text key={item} style={{ flex: 'none' }}>
						{item}
					</Text>
				))}
			</Cluster>
		</ScrollFade>
	);
};
