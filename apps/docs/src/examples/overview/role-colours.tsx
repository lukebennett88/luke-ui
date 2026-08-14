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

const modes = ['light', 'dark'] as const;

export default () => {
	const [role, setRole] = useState<Role>('warning');

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
			<Box
				display="grid"
				gap="300"
				style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(16rem, 100%), 1fr))' }}
			>
				{modes.map((mode) => (
					<Box
						data-color-mode={mode}
						display="grid"
						gap="200"
						key={mode}
						padding="300"
						style={{
							backgroundColor: vars.color.surface.canvas,
							borderRadius: vars.radius.surface,
						}}
					>
						<Text elementType="strong" fontWeight="emphasis" typography="caption">
							{mode === 'light' ? 'Light mode' : 'Dark mode'}
						</Text>
						<Box
							display="grid"
							gap="200"
							padding="200"
							style={{
								backgroundColor: vars.color.surface.floating,
								border: `1px solid ${vars.color.border.decorative}`,
								borderRadius: vars.radius.surface,
							}}
						>
							<Box
								display="grid"
								gap="100"
								padding="300"
								style={{
									backgroundColor: vars.color.background[role].subtle,
									border: `1px solid ${vars.color.border[role]}`,
									borderRadius: vars.radius.control,
								}}
							>
								<Box alignItems="center" display="flex" flexWrap="wrap" gap="100">
									<Text
										elementType="strong"
										fontWeight="emphasis"
										style={{ color: vars.color.foreground[role].rest }}
									>
										Account status
									</Text>
									<Text
										elementType="span"
										fontWeight="emphasis"
										typography="caption"
										style={{
											backgroundColor: vars.color.background[role].solid,
											borderRadius: vars.radius.full,
											color: vars.color.foreground[role].onSolid,
											padding: `${vars.space[100]} ${vars.space[200]}`,
										}}
									>
										{roles[role]}
									</Text>
								</Box>
								<Text style={{ color: vars.color.foreground[role].rest }}>
									This notice uses the selected semantic role.
								</Text>
							</Box>
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);
};
