import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Small
				</Text>
				<TextField label="Example field" name="example" placeholder="Example input" size="small" />
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Medium
				</Text>
				<TextField label="Example field" name="example" placeholder="Example input" size="medium" />
			</Box>
		</Box>
	);
};
