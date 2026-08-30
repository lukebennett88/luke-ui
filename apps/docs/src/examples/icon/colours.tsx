import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import type { PropsWithChildren } from 'react';

const colours = [
	{ label: 'Primary', color: 'primary' },
	{ label: 'Secondary', color: 'secondary' },
	{ label: 'Accent', color: 'accent' },
	{ label: 'Info', color: 'info' },
	{ label: 'Success', color: 'success' },
	{ label: 'Warning', color: 'warning' },
	{ label: 'Danger', color: 'danger' },
] as const;

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			{colours.map(({ color, label }) => (
				<FlexCol key={color}>
					<Text color={color}>
						<Icon name="checkCircle" title="Example icon" />
					</Text>
					<Text color="secondary">{label}</Text>
				</FlexCol>
			))}
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
