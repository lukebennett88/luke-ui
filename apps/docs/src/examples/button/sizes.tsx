import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';

export default function Sizes() {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<Button size="small">Edit profile</Button>
			<Button size="medium">Edit profile</Button>
		</Box>
	);
}
