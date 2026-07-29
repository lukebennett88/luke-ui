import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';

export default function Tones() {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<Button>Cancel</Button>
			<Button tone="accent">Save changes</Button>
			<Button tone="danger">Delete account</Button>
		</Box>
	);
}
