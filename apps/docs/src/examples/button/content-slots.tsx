import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Button startContent={<Icon name="add" />}>Add item</Button>
			<Button endContent={<Kbd>⌘S</Kbd>}>Save</Button>
		</Box>
	);
};
