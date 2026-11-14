import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Dialog } from '@luke-ui/react/dialog';
import { useState } from 'react';

export default () => {
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);

	async function save() {
		setIsPending(true);
		await new Promise((resolve) => {
			setTimeout(resolve, 1200);
		});
		setIsPending(false);
		setIsOpen(false);
	}

	return (
		<>
			<Button onPress={() => setIsOpen(true)}>Open dialog</Button>
			<Dialog
				description="Dialog description."
				isDismissable={!isPending}
				isKeyboardDismissDisabled={isPending}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				title="Example dialog"
			>
				<Cluster gap="space.8" justifyContent="flex-end">
					<Button isDisabled={isPending} prominence="low" slot="close">
						Cancel
					</Button>
					<Button isPending={isPending} onPress={save} prominence="high">
						Save changes
					</Button>
				</Cluster>
			</Dialog>
		</>
	);
};
