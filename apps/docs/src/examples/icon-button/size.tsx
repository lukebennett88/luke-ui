import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';

export default () => {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<IconButton aria-label="Search" icon="search" size="small" />
			<IconButton aria-label="Search" icon="search" />
		</Box>
	);
};
