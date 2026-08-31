import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import type { PropsWithChildren } from 'react';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<FlexCol>
				<Text color="primary">
					<Icon name="checkCircle" />
				</Text>
				<Text color="secondary">Primary</Text>
			</FlexCol>
			<FlexCol>
				<Text color="secondary">
					<Icon name="checkCircle" />
				</Text>
				<Text color="secondary">Secondary</Text>
			</FlexCol>
			<FlexCol>
				<Text color="accent">
					<Icon name="checkCircle" />
				</Text>
				<Text color="secondary">Accent</Text>
			</FlexCol>
			<FlexCol>
				<Text color="info">
					<Icon name="checkCircle" />
				</Text>
				<Text color="secondary">Info</Text>
			</FlexCol>
			<FlexCol>
				<Text color="success">
					<Icon name="checkCircle" />
				</Text>
				<Text color="secondary">Success</Text>
			</FlexCol>
			<FlexCol>
				<Text color="warning">
					<Icon name="checkCircle" />
				</Text>
				<Text color="secondary">Warning</Text>
			</FlexCol>
			<FlexCol>
				<Text color="danger">
					<Icon name="checkCircle" />
				</Text>
				<Text color="secondary">Danger</Text>
			</FlexCol>
		</Box>
	);
};

function FlexCol({ children }: PropsWithChildren) {
	return (
		<Box alignItems="center" display="flex" flexDirection="column" gap="sp4">
			{children}
		</Box>
	);
}
