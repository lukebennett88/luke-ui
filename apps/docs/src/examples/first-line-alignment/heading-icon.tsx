import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="startContent">
				<Box maxInlineSize="14rem">
					<Heading level={2} startContent={<Icon name="checkCircle" />} typography="heading3">
						Section heading that wraps
					</Heading>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
