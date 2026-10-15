import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Current: Track around Heading">
				<Box maxInlineSize="14rem">
					<Track gap="sp8" railAlignment="firstLine" railStart={<Icon name="checkCircle" />}>
						<Heading level={2} typography="heading3">
							Section heading that wraps
						</Heading>
					</Track>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Current: Track inside Heading">
				<Box maxInlineSize="14rem">
					<Heading level={2} typography="heading3">
						<Track
							elementType="span"
							gap="sp8"
							railAlignment="firstLine"
							railStart={<Icon name="checkCircle" />}
						>
							Section heading that wraps
						</Track>
					</Heading>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Proposed: startContent">
				<Box maxInlineSize="14rem">
					<Heading level={2} startContent={<Icon name="checkCircle" />} typography="heading3">
						Section heading that wraps
					</Heading>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
