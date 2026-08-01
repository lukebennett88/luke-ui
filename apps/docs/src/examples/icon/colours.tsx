import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';

export default function Colours() {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<Box alignItems="center" display="flex" flexDirection="column" gap="100">
				<Text color="accent">
					<Icon name="checkCircle" title="Accent" />
				</Text>
				<Text color="secondary">accent</Text>
			</Box>
			<Box alignItems="center" display="flex" flexDirection="column" gap="100">
				<Text color="success">
					<Icon name="checkCircle" title="Success" />
				</Text>
				<Text color="secondary">success</Text>
			</Box>
			<Box alignItems="center" display="flex" flexDirection="column" gap="100">
				<Text color="warning">
					<Icon name="exclamationTriangle" title="Warning" />
				</Text>
				<Text color="secondary">warning</Text>
			</Box>
			<Box alignItems="center" display="flex" flexDirection="column" gap="100">
				<Text color="danger">
					<Icon name="closeCircle" title="Danger" />
				</Text>
				<Text color="secondary">danger</Text>
			</Box>
		</Box>
	);
}
