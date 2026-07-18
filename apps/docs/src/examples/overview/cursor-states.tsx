import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Link } from '@luke-ui/react/link';
import { TextField } from '@luke-ui/react/text-field';

export default function CursorStatesExample() {
	return (
		<Box display="grid" gap="400">
			<Box alignItems="center" display="flex" flexWrap="wrap" gap="300">
				<Button tone="accent">Button</Button>
				<Button appearance="ghost">Ghost button</Button>
				<Link href="#cursor-states" isStandalone>
					Link
				</Link>
				<Button isDisabled>Disabled</Button>
				<Button isPending>Saving</Button>
			</Box>
			<TextField label="Project name" name="projectName" placeholder="Luke UI" />
		</Box>
	);
}
