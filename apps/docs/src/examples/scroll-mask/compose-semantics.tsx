import { Heading } from '@luke-ui/react/heading';
import { ScrollMask } from '@luke-ui/react/scroll-mask';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function ComposeSemantics() {
	return (
		<nav aria-labelledby="related-heading">
			<Stack gap="sp8">
				<Heading id="related-heading" level={3}>
					Related
				</Heading>
				<ScrollMask aria-label="Related components" inlineSize="16rem" padding="sp12">
					<div style={{ display: 'flex', gap: vars.space.sp16 }}>
						{['Box', 'Stack', 'Cluster', 'Container', 'Aspect ratio'].map((item) => (
							<Text key={item} style={{ flex: 'none' }}>
								{item}
							</Text>
						))}
					</div>
				</ScrollMask>
			</Stack>
		</nav>
	);
}
