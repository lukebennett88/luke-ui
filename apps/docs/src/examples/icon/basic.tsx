import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';

export default function Basic() {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<Icon name="search" size="small" title="Search" />
			<Icon name="edit" size="small" title="Edit" />
			<Icon name="checkCircle" size="small" title="Complete" />
		</Box>
	);
}
