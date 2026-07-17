import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';

export default function Size() {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<IconButton appearance="subtle" aria-label="Search" icon="search" size="small" />
			<IconButton appearance="subtle" aria-label="Search" icon="search" />
		</Box>
	);
}
