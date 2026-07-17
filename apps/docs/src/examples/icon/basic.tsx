import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';

export default function Basic() {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<Icon name="checkCircle" size="small" title="Complete" />
			<Text>
				<Icon aria-hidden name="arrowRight" size="small" /> Continue
			</Text>
		</Box>
	);
}
