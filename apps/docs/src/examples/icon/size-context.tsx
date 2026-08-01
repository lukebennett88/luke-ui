import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { IconSizeProvider } from '@luke-ui/react/icon-size-context';

export default function SizeContext() {
	return (
		<IconSizeProvider size="small">
			<Box alignItems="center" display="flex" gap="400">
				<Icon name="chevronLeft" title="Previous" />
				<Icon name="chevronRight" title="Next" />
			</Box>
		</IconSizeProvider>
	);
}
