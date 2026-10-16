import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

const url = 'https://example.com/a/very/long/unbroken/path/that/needs/to/wrap';
const copy = 'Example message that is long enough to clamp after the first line';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Text adornments">
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
