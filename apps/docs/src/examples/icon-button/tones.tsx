import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<IconButton aria-label="Search" icon="search" />
			<IconButton aria-label="Add item" icon="add" tone="accent" />
			<IconButton aria-label="Delete item" icon="delete" tone="danger" />
		</Box>
	);
};
