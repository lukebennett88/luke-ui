import { Box } from '@luke-ui/react/box';
import { Icon, IconSizeProvider } from '@luke-ui/react/icon';

export default () => {
	return (
		<IconSizeProvider size="small">
			<Box alignItems="center" display="flex" gap="sp16">
				<Icon name="chevronLeft" title="Previous" />
				<Icon name="chevronRight" title="Next" />
			</Box>
		</IconSizeProvider>
	);
};
