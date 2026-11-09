import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

const roles = {
	neutral: 'Neutral',
	accent: 'Accent',
	info: 'Info',
	success: 'Success',
	warning: 'Warning',
	danger: 'Danger',
} as const;

type Role = keyof typeof roles;

export default () => {
	const [role, setRole] = useState<Role>('warning');

	return (
		<Stack gap="space.16">
			<Cluster aria-label="Semantic role" gap="space.8" role="group">
				{(Object.keys(roles) as Array<Role>).map((option) => (
					<Button
						aria-pressed={role === option}
						key={option}
						onPress={() => setRole(option)}
						prominence={role === option ? 'high' : 'standard'}
					>
						{roles[option]}
					</Button>
				))}
			</Cluster>
			<Box
				backgroundColor="surface.base"
				borderRadius="surface"
				display="grid"
				gap="space.8"
				padding="space.12"
			>
				<Box
					backgroundColor="surface.subdued"
					borderColor="decorative"
					borderRadius="surface"
					borderStyle="solid"
					borderWidth="thin"
					display="grid"
					gap="space.8"
					padding="space.8"
				>
					<Box
						backgroundColor={`${role}.subtle`}
						borderColor={`${role}.strong`}
						borderRadius="control"
						borderStyle="solid"
						borderWidth="thin"
						display="grid"
						gap="space.4"
						padding="space.12"
					>
						<Cluster alignItems="center" gap="space.4">
							<Text color={role} elementType="strong" fontWeight="emphasis">
								Account status
							</Text>
							<Box
								backgroundColor={`${role}.solid`}
								borderRadius="full"
								display="inline-flex"
								elementType="span"
								paddingBlock="space.4"
								paddingInline="space.8"
							>
								<Text elementType="span" fontWeight="emphasis" typography="caption">
									{roles[role]}
								</Text>
							</Box>
						</Cluster>
						<Text color={role}>This notice uses the selected semantic role.</Text>
					</Box>
				</Box>
			</Box>
		</Stack>
	);
};
