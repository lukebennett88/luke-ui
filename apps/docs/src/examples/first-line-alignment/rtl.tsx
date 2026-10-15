import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Current: Track">
				<Box dir="rtl" maxInlineSize="14rem">
					<Track
						gap="sp8"
						railAlignment="firstLine"
						railEnd={<Kbd>Esc</Kbd>}
						railStart={<Icon name="arrowLeft" />}
					>
						<Heading level={2} typography="heading4">
							عنوان طويل يلتف على سطرين
						</Heading>
					</Track>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Proposed: startContent and endContent">
				<Box dir="rtl" maxInlineSize="14rem">
					<Heading
						endContent={<Kbd>Esc</Kbd>}
						level={2}
						startContent={<Icon name="arrowLeft" />}
						typography="heading4"
					>
						عنوان طويل يلتف على سطرين
					</Heading>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Proposed: paragraph">
				<Box dir="rtl" maxInlineSize="14rem">
					<Text elementType="p" startContent={<Icon name="checkCircle" size="small" />}>
						نص طويل يلتف على عدة أسطر عندما تكون المساحة محدودة
					</Text>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
