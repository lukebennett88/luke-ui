import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import type { TextRecipeVariants } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';

const roles = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const;

const onSolidByRole = {
	neutral: 'neutral.onSolid',
	accent: 'accent.onSolid',
	info: 'info.onSolid',
	success: 'success.onSolid',
	warning: 'warning.onSolid',
	danger: 'danger.onSolid',
} as const satisfies Record<(typeof roles)[number], TextRecipeVariants['color']>;

const solidBackgroundByRole = {
	neutral: 'neutral.solid.rest',
	accent: 'accent.solid.rest',
	info: 'info.solid.rest',
	success: 'success.solid.rest',
	warning: 'warning.solid.rest',
	danger: 'danger.solid.rest',
} as const;

export default () => {
	return (
		<Stack gap="space.16">
			<Cluster gap="space.12">
				<Text color="primary">Primary</Text>
				<Text color="secondary">Secondary</Text>
				<Text color="disabled">Disabled</Text>
			</Cluster>
			<Cluster gap="space.12">
				{roles.map((role) => (
					<Text color={role} key={role}>
						{role}
					</Text>
				))}
			</Cluster>
			<Cluster gap="space.8">
				{roles.map((role) => (
					<Box backgroundColor={solidBackgroundByRole[role]} key={role} padding="space.8">
						<Text color={onSolidByRole[role]}>{role}.onSolid</Text>
					</Box>
				))}
			</Cluster>
		</Stack>
	);
};
