import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Neutral
				</Text>
				<IconButton aria-label="Example action" icon="search" tone="neutral" />
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Accent
				</Text>
				<IconButton aria-label="Example action" icon="search" tone="accent" />
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Danger
				</Text>
				<IconButton aria-label="Example action" icon="search" tone="danger" />
			</Box>
		</Box>
	);
};
