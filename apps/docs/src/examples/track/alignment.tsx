import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Center">
				<Box maxInlineSize="18rem">
					<Track gap="sp8" railAlignment="center" railStart={<Icon name="exclamationTriangle" />}>
						Example message that wraps onto multiple lines when the available space is limited.
					</Track>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="First line">
				<Box maxInlineSize="18rem">
					<Track
						gap="sp8"
						railAlignment="firstLine"
						railStart={<Icon name="exclamationTriangle" />}
					>
						Example message that wraps onto multiple lines when the available space is limited.
					</Track>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
