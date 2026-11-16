import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Dialog, DialogTrigger } from '@luke-ui/react/dialog';
import { useTransition } from 'react';

export default () => {
	const [isPending, startTransition] = useTransition();

	return (
		<DialogTrigger>
			<Button>Open dialog</Button>
			<Dialog
				description="Dialog description."
				isCloseButtonDisabled={isPending}
				isDismissable={!isPending}
				isKeyboardDismissDisabled={isPending}
				showCloseButton
				title="Example dialog"
			>
				{({ close }) => (
					<Cluster gap="space.8" justifyContent="flex-end">
						<Button isDisabled={isPending} prominence="low" slot="close">
							Cancel
						</Button>
						<Button
							isPending={isPending}
							onPress={() => startTransition(() => save().then(close))}
							prominence="high"
						>
							Save changes
						</Button>
					</Cluster>
				)}
			</Dialog>
		</DialogTrigger>
	);
};

function save() {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, 1200);
	});
}
