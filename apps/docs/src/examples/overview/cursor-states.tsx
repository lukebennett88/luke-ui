import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { TextField } from '@luke-ui/react/text-field';

export default function CursorStatesExample() {
	return (
		<Box alignItems="flex-end" display="flex" flexWrap="wrap" gap="300">
			<Button tone="accent">Save</Button>
			<Button isDisabled>Save</Button>
			<Button isPending>Saving</Button>
			<Box inlineSize="12rem">
				<TextField label="Name" name="name" />
			</Box>
		</Box>
	);
}
