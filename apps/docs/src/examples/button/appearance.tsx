import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Solid
				</Text>
				<Button appearance="solid">Example button</Button>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Subtle
				</Text>
				<Button appearance="subtle">Example button</Button>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Ghost
				</Text>
				<Button appearance="ghost">Example button</Button>
			</Box>
		</Box>
	);
};
