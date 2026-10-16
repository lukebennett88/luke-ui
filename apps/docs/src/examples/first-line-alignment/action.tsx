import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

const dismiss = <IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />;

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="endContent">
				<Box maxInlineSize="18rem">
					<Text
						elementType="p"
						endContent={dismiss}
						startContent={<Icon name="checkCircle" size="small" />}
					>
						Example message that wraps onto a second line
					</Text>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="heading beside an action">
				<Box
					alignItems="baseline"
					display="flex"
					gap="sp12"
					justifyContent="space-between"
					maxInlineSize="18rem"
				>
					<Heading level={2} startContent={<Icon name="edit" />} typography="heading4">
						Section heading that wraps
					</Heading>
					<Box flexShrink="0">
						<Button prominence="low" size="small">
							Edit
						</Button>
					</Box>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
