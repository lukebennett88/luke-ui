import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
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

export default function RoleColoursExample() {
	const [role, setRole] = useState<Role>('info');

	return (
		<Box display="grid" gap="400">
			<Box aria-label="Semantic role" display="flex" flexWrap="wrap" gap="200" role="group">
				{(Object.keys(roles) as Array<Role>).map((option) => (
					<Button
						appearance={role === option ? 'solid' : 'subtle'}
						aria-pressed={role === option}
						key={option}
						onPress={() => setRole(option)}
					>
						{roles[option]}
					</Button>
				))}
			</Box>
			<Box display="grid" gap="200" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
				<Box
					padding="400"
					role="status"
					style={{
						backgroundColor: vars.color.background[role].subtle.rest,
						border: `1px solid ${vars.color.border[role]}`,
						borderRadius: vars.radius.surface,
						color: vars.color.foreground[role].rest,
					}}
				>
					<Text elementType="strong" fontWeight="emphasis">
						Subtle
					</Text>
				</Box>
				<Box
					padding="400"
					role="status"
					style={{
						backgroundColor: vars.color.background[role].solid.rest,
						borderRadius: vars.radius.surface,
						color: vars.color.foreground[role].onSolid,
					}}
				>
					<Text elementType="strong" fontWeight="emphasis">
						Solid
					</Text>
				</Box>
			</Box>
		</Box>
	);
}
