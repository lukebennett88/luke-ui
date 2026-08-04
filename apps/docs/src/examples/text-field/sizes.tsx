import { Box } from '@luke-ui/react/box';
import { TextField } from '@luke-ui/react/text-field';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<TextField label="Search" name="smallSearch" placeholder="Search" size="small" />
			<TextField label="Search" name="mediumSearch" placeholder="Search" size="medium" />
		</Box>
	);
};
