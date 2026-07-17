import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';

export default function ToneAndAppearance() {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<IconButton appearance="solid" aria-label="Bookmark" icon="bookmark" tone="accent" />
			<IconButton appearance="subtle" aria-label="Bookmark" icon="bookmark" tone="accent" />
			<IconButton appearance="ghost" aria-label="Bookmark" icon="bookmark" tone="accent" />
		</Box>
	);
}
