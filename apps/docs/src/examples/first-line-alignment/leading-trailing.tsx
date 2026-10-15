import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Current: Track">
				<Box maxInlineSize="16rem">
					<Track
						gap="sp8"
						railAlignment="firstLine"
						railEnd={<Kbd>Esc</Kbd>}
						railStart={<Icon name="exclamationTriangle" size="small" />}
					>
						<Text elementType="p" typography="label">
							Example message that wraps onto a second line
						</Text>
					</Track>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Proposed: startContent and endContent">
				<Box maxInlineSize="16rem">
					<Text
						elementType="p"
						endContent={<Kbd>Esc</Kbd>}
						startContent={<Icon name="exclamationTriangle" size="small" />}
						typography="label"
					>
						Example message that wraps onto a second line
					</Text>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
