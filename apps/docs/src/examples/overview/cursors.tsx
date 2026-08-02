import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Link } from '@luke-ui/react/link';
import { TextField } from '@luke-ui/react/text-field';

export default function CursorsExample() {
	return (
		<Box alignItems="flex-end" display="flex" flexWrap="wrap" gap="600">
			<Button>Save</Button>
			<Link href="#">Read more</Link>
			<Button isDisabled>Unavailable</Button>
			<Button isPending>Saving</Button>
			<TextField label="Name" placeholder="Ada Lovelace" />
		</Box>
	);
}
