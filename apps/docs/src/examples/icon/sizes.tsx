import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';

export default function Sizes() {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<Box alignItems="center" display="flex" flexDirection="column" gap="100">
				<Icon name="search" size="xsmall" title="Search" />
				<Text color="secondary">xsmall</Text>
			</Box>
			<Box alignItems="center" display="flex" flexDirection="column" gap="100">
				<Icon name="search" size="small" title="Search" />
				<Text color="secondary">small</Text>
			</Box>
			<Box alignItems="center" display="flex" flexDirection="column" gap="100">
				<Icon name="search" size="medium" title="Search" />
				<Text color="secondary">medium</Text>
			</Box>
			<Box alignItems="center" display="flex" flexDirection="column" gap="100">
				<Icon name="search" size="large" title="Search" />
				<Text color="secondary">large</Text>
			</Box>
		</Box>
	);
}
