import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Dialog, DialogTrigger } from '@luke-ui/react/dialog';

export default () => {
	return (
		<DialogTrigger>
			<Button tone="danger">Delete item</Button>
			<Dialog description="This cannot be undone." role="alertdialog" title="Delete item?">
				{({ close }) => (
					<Cluster gap="space.8" justifyContent="flex-end">
						<Button prominence="low" slot="close">
							Cancel
						</Button>
						<Button onPress={close} prominence="high" tone="danger">
							Delete
						</Button>
					</Cluster>
				)}
			</Dialog>
		</DialogTrigger>
	);
};
