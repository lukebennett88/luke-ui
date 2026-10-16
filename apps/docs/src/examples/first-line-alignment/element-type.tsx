import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Default span: inline flow">
				<Stack maxInlineSize="16rem">
					<Text
						endContent={<Kbd>⌘K</Kbd>}
						startContent={<Icon name="exclamationTriangle" size="small" />}
					>
						Example message that wraps onto a second line
					</Text>
				</Stack>
			</ComparisonItem>
			<ComparisonItem label="Paragraph: hanging lines">
				<Stack maxInlineSize="16rem">
					<Text
						elementType="p"
						endContent={<Kbd>⌘K</Kbd>}
						startContent={<Icon name="exclamationTriangle" size="small" />}
					>
						Example message that wraps onto a second line
					</Text>
				</Stack>
			</ComparisonItem>
		</Comparison>
	);
};
