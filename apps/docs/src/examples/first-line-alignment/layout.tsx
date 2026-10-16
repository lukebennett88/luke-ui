import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Stack gap="sp24">
			<Comparison direction="horizontal">
				{(['start', 'center', 'end'] as const).map((alignment) => {
					return (
						<ComparisonItem key={alignment} label={alignment}>
							<Box alignItems={alignment} display="flex" gap="sp8" maxInlineSize="16rem">
								<Icon name="checkCircle" />
								<Stack gap="sp8" minInlineSize="0">
									<Text fontWeight="emphasis">Example title</Text>
									<Text color="secondary" typography="caption">
										Description on a second line
									</Text>
								</Stack>
							</Box>
						</ComparisonItem>
					);
				})}
			</Comparison>
			<Cluster alignItems="center" gap="sp8">
				<Icon name="bookOpen" />
				<Text>Items that wrap as a group</Text>
			</Cluster>
			<Box elementType="ul" margin="0" padding="0" style={{ listStyle: 'none' }}>
				<Box alignItems="start" display="flex" elementType="li" gap="sp8">
					<Icon name="checkCircle" />
					<Text>First item</Text>
				</Box>
				<Box alignItems="start" display="flex" elementType="li" gap="sp8">
					<Icon name="checkCircle" />
					<Text>Second item</Text>
				</Box>
			</Box>
		</Stack>
	);
};
