import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<Button appearance="solid">Save changes</Button>
			<Button appearance="subtle">Save changes</Button>
			<Button appearance="ghost">Save changes</Button>
		</Box>
	);
};
