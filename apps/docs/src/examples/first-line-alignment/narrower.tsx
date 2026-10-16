import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs';

const copy = 'Example message that is long enough to clamp after the first line';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Nested row: outer lineClamp">
				<Box maxInlineSize="14rem">
					<Text elementType="p" lineClamp={1}>
						<Track
							elementType="span"
							gap="sp8"
							railAlignment="firstLine"
							railStart={<Icon name="bookOpen" size="small" />}
						>
							{copy}
						</Track>
					</Text>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Text adornments: lineClamp">
				<Box maxInlineSize="14rem">
					<Text elementType="p" lineClamp={1} startContent={<Icon name="bookOpen" size="small" />}>
						{copy}
					</Text>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Nested row: typography inside the row">
				<Box maxInlineSize="14rem">
					<Text elementType="div">
						<Track
							elementType="span"
							gap="sp8"
							railAlignment="firstLine"
							railStart={<Icon name="bookOpen" />}
						>
							<Heading level={3} typography="heading3">
								Heading inside the row
							</Heading>
						</Track>
					</Text>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Nested row: text Link">
				<Link href="#narrower">
					<Track elementType="span" gap="sp4" railStart={<Icon name="bookOpen" size="xsmall" />}>
						Example link
					</Track>
				</Link>
			</ComparisonItem>
			<ComparisonItem label="Text adornments: text Link">
				<Link href="#narrower">
					<Text shouldInheritFont startContent={<Icon name="bookOpen" size="xsmall" />}>
						Example link
					</Text>
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
