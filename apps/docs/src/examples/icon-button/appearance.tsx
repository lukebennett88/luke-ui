import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Solid
				</Text>
				<IconButton appearance="solid" aria-label="Example action" icon="bookOpen" />
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Subtle
				</Text>
				<IconButton appearance="subtle" aria-label="Example action" icon="bookOpen" />
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Ghost
				</Text>
				<IconButton appearance="ghost" aria-label="Example action" icon="bookOpen" />
			</Box>
		</Box>
	);
};
