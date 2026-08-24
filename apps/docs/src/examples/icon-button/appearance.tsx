import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<IconButton appearance="solid" aria-label="Open documentation" icon="bookOpen" />
			<IconButton appearance="subtle" aria-label="Open documentation" icon="bookOpen" />
			<IconButton appearance="ghost" aria-label="Open documentation" icon="bookOpen" />
		</Box>
	);
};
