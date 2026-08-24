import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import type { PropsWithChildren } from 'react';

export default () => {
	return (
		<Box alignItems="flex-end" display="flex" gap="sp16">
			<FlexCol>
				<Icon name="search" size="xsmall" />
				<Text color="secondary">xsmall</Text>
			</FlexCol>
			<FlexCol>
				<Icon name="search" size="small" />
				<Text color="secondary">small</Text>
			</FlexCol>
			<FlexCol>
				<Icon name="search" size="medium" />
				<Text color="secondary">medium</Text>
			</FlexCol>
			<FlexCol>
				<Icon name="search" size="large" />
				<Text color="secondary">large</Text>
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
