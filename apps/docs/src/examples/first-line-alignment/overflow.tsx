import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs';

const url = 'https://example.com/a/very/long/unbroken/path/that/needs/to/wrap';
const copy = 'Example message that is long enough to clamp after the first line';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Current: Track">
				<Stack gap="sp16" maxInlineSize="14rem">
					<Track
						gap="sp8"
						railAlignment="firstLine"
						railEnd={<Icon name="copy" size="small" />}
						railStart={<Icon name="externalLink" size="small" />}
					>
						<Text elementType="p">{url}</Text>
					</Track>
					<Track
						gap="sp8"
						railAlignment="firstLine"
						railStart={<Icon name="bookOpen" size="small" />}
					>
						<Text elementType="p" lineClamp={1}>
							{copy}
						</Text>
					</Track>
				</Stack>
			</ComparisonItem>
			<ComparisonItem label="Proposed: Text adornments">
				<Stack gap="sp16" maxInlineSize="14rem">
					<Text
						elementType="p"
						endContent={<Icon name="copy" size="small" />}
						startContent={<Icon name="externalLink" size="small" />}
					>
						{url}
					</Text>
					<Text elementType="p" lineClamp={1} startContent={<Icon name="bookOpen" size="small" />}>
						{copy}
					</Text>
				</Stack>
			</ComparisonItem>
		</Comparison>
	);
};
