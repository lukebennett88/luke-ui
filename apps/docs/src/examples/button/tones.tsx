import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Neutral
				</Text>
				<Button tone="neutral">Example button</Button>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Accent
				</Text>
				<Button tone="accent">Example button</Button>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Danger
				</Text>
				<Button tone="danger">Example button</Button>
			</Box>
		</Box>
	);
};
