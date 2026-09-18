import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Center">
				<Box maxInlineSize="20rem">
					<Track gap="sp8" railAlignment="center" railStart={<Icon name="checkCircle" />}>
						Your export is ready to download. It will remain available for 24 hours.
					</Track>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="First line">
				<Box maxInlineSize="20rem">
					<Track gap="sp8" railAlignment="firstLine" railEnd={<Button>View details</Button>}>
						Review the quarterly performance report and share the summary with the team.
					</Track>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
