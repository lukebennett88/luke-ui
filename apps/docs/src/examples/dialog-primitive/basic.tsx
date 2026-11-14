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

export default () => {
	return (
		<DialogTrigger>
			<Button>Open dialog</Button>
			<DialogOverlay isDismissable>
				<DialogSurface>
					<DialogContent>
						<Stack gap="space.16">
							<Heading level={2} slot="title" typography="heading3">
								Example dialog
							</Heading>
							<Text color="secondary" elementType="p" slot="description">
								Dialog description.
							</Text>
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
