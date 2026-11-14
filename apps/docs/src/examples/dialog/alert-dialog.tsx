import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Dialog } from '@luke-ui/react/dialog';
import { useState } from 'react';

export default () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button onPress={() => setIsOpen(true)} tone="danger">
				Delete item
			</Button>
			<Dialog
				description="This cannot be undone."
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				role="alertdialog"
				title="Delete item?"
			>
				<Cluster gap="space.8" justifyContent="flex-end">
					<Button prominence="low" slot="close">
						Cancel
					</Button>
					<Button onPress={() => setIsOpen(false)} prominence="high" tone="danger">
						Delete
					</Button>
				</Cluster>
			</Dialog>
		</>
	);
};
