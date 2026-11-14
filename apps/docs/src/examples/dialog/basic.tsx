import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Dialog } from '@luke-ui/react/dialog';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button onPress={() => setIsOpen(true)}>Open dialog</Button>
			<Dialog
				description="Dialog description."
				isDismissable
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				title="Example dialog"
			>
				<Text elementType="p">Dialog content.</Text>
				<Cluster justifyContent="flex-end">
					<Button prominence="high" slot="close">
						Close
					</Button>
				</Cluster>
			</Dialog>
		</>
	);
};
