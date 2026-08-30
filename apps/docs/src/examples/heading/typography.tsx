import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';

const typographyStyles = [
	'body',
	'lead',
	'heading4',
	'heading3',
	'heading2',
	'heading1',
	'display',
] as const;

export default () => {
	return (
		<Box display="grid" gap="sp12">
			{typographyStyles.map((typography) => (
				<Box alignItems="baseline" display="grid" gap="sp8" key={typography}>
					<Text color="secondary" typography="caption">
						{typography}
					</Text>
					<Heading level={2} typography={typography}>
						Example heading
					</Heading>
				</Box>
			))}
		</Box>
	);
};
