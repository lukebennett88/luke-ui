import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';

export default function Icons() {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<Button startIcon={<Icon aria-hidden name="add" />}>Add item</Button>
			<Button appearance="subtle" endIcon={<Icon aria-hidden name="arrowRight" />}>
				Continue
			</Button>
		</Box>
	);
}
