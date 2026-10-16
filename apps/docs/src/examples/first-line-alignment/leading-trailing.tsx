import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="startContent and endContent">
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
