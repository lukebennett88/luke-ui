import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';

export default function Pending() {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<Button isPending tone="accent">
				Save changes
			</Button>
			<Button appearance="subtle" isPending>
				Save changes
			</Button>
		</Box>
	);
}
