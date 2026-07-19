import { Button } from '@luke-ui/react/button';
import {
	Dialog,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@luke-ui/react/dialog';

export default function DefaultDialog() {
	return (
		<DialogTrigger>
			<Button>Open Dialog</Button>
			<Dialog>
				<DialogHeader>
					<DialogTitle>Confirm action</DialogTitle>
					<DialogDescription>
						Are you sure you want to proceed with this action? This cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button appearance="subtle">Cancel</Button>
					<Button tone="accent">Confirm</Button>
				</DialogFooter>
			</Dialog>
		</DialogTrigger>
	);
}
