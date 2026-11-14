import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import {
	DialogContent,
	DialogOverlay,
	DialogSurface,
	DialogTrigger,
} from '@luke-ui/react/primitives/dialog';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useId } from 'react';

export default () => {
	const descriptionId = useId();

	return (
		<DialogTrigger>
			<Button>Open dialog</Button>
			<DialogOverlay isDismissable>
				<DialogSurface>
					<DialogContent aria-describedby={descriptionId}>
						<Stack gap="space.16">
							<Heading level={2} slot="title" typography="heading3">
								Example dialog
							</Heading>
							<Stack gap="space.8" id={descriptionId}>
								<Text elementType="p">First paragraph of the description.</Text>
								<Text elementType="p">Second paragraph of the description.</Text>
							</Stack>
							<Cluster justifyContent="flex-end">
								<Button prominence="high" slot="close">
									Close
								</Button>
							</Cluster>
						</Stack>
					</DialogContent>
				</DialogSurface>
			</DialogOverlay>
		</DialogTrigger>
	);
};
