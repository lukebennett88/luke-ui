import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="heading3 title">
				<Box maxInlineSize="22rem">
					<Text
						elementType="div"
						endContent={
							<IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />
						}
						gap="sp12"
						startContent={<Avatar />}
						typography="heading3"
					>
						<Stack gap="sp8">
							<Text elementType="p" shouldInheritFont>
								Notification title that wraps
							</Text>
							<Text color="secondary" elementType="p" typography="caption">
								Description that may wrap onto a second line of text
							</Text>
						</Stack>
					</Text>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="label title">
				<Box maxInlineSize="22rem">
					<Text
						elementType="div"
						endContent={
							<IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />
						}
						gap="sp12"
						startContent={<Avatar />}
						typography="label"
					>
						<Stack gap="sp4">
							<Text elementType="p" shouldInheritFont>
								Notification title that wraps
							</Text>
							<Text color="secondary" elementType="p" typography="caption">
								Description that may wrap onto a second line of text
							</Text>
						</Stack>
					</Text>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};

function Avatar() {
	return (
		<Box
			aria-hidden="true"
			backgroundColor="neutral.subtle.rest"
			blockSize="2.5rem"
			borderRadius="full"
			display="inline-flex"
			elementType="span"
			inlineSize="2.5rem"
		/>
	);
}
