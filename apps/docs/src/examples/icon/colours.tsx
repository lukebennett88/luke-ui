import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import type { PropsWithChildren } from 'react';

export default () => {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<FlexCol>
				<Text color="accent">
					<Icon name="checkCircle" title="Accent" />
				</Text>
				<Text color="secondary">accent</Text>
			</FlexCol>
			<FlexCol>
				<Text color="success">
					<Icon name="checkCircle" title="Success" />
				</Text>
				<Text color="secondary">success</Text>
			</FlexCol>
			<FlexCol>
				<Text color="warning">
					<Icon name="exclamationTriangle" title="Warning" />
				</Text>
				<Text color="secondary">warning</Text>
			</FlexCol>
			<FlexCol>
				<Text color="danger">
					<Icon name="closeCircle" title="Danger" />
				</Text>
				<Text color="secondary">danger</Text>
			</FlexCol>
		</Box>
	);
};

function FlexCol({ children }: PropsWithChildren) {
	return (
		<Box alignItems="center" display="flex" flexDirection="column" gap="100">
			{children}
		</Box>
	);
}
