import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';

export default function Appearance() {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<Button appearance="solid" tone="accent">
				Save changes
			</Button>
			<Button appearance="subtle" tone="accent">
				Save changes
			</Button>
			<Button appearance="ghost" tone="accent">
				Save changes
			</Button>
		</Box>
	);
}
