import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Button startIcon={<Icon name="add" />}>Add item</Button>
			<Button appearance="subtle" endIcon={<Icon name="arrowRight" />}>
				Continue
			</Button>
		</Box>
	);
};
