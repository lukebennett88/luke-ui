import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Button>Cancel</Button>
			<Button tone="accent">Save changes</Button>
			<Button tone="danger">Delete account</Button>
		</Box>
	);
};
