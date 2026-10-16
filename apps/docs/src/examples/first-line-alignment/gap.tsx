import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Default: sp8 block, sp4 inline">
				<Stack gap="sp16" maxInlineSize="16rem">
					<Text elementType="p" startContent={<Icon name="checkCircle" size="small" />}>
						A block message that wraps onto a second line
					</Text>
					<Text startContent={<Icon name="checkCircle" size="xsmall" />}>Inline text</Text>
				</Stack>
			</ComparisonItem>
			<ComparisonItem label="sp16">
				<Stack gap="sp16" maxInlineSize="16rem">
					<Text elementType="p" gap="sp16" startContent={<Icon name="checkCircle" size="small" />}>
						A block message that wraps onto a second line
					</Text>
					<Text gap="sp16" startContent={<Icon name="checkCircle" size="xsmall" />}>
						Inline text
					</Text>
				</Stack>
			</ComparisonItem>
			<ComparisonItem label="Responsive: sp4 to sp16 at bp640">
				<Heading
					gap={{ initial: 'sp4', bp640: 'sp16' }}
					level={2}
					startContent={<Icon name="bookOpen" />}
					typography="heading4"
				>
					Example heading
				</Heading>
			</ComparisonItem>
		</Comparison>
	);
};
