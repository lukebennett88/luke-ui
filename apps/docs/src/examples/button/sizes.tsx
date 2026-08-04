import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';

export default () => {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<Button size="small" startIcon={<Icon name="edit" />}>
				Edit profile
			</Button>
			<Button size="medium" startIcon={<Icon name="edit" />}>
				Edit profile
			</Button>
		</Box>
	);
};
