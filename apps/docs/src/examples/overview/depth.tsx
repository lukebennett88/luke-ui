import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

const depthRoles = [
	{
		description: 'Pressed controls and sunken areas',
		depth: vars.depth.recessed,
		label: 'Recessed',
		surface: vars.color.surface.recessed,
	},
	{
		description: 'Ordinary controls and surfaces',
		depth: vars.depth.resting,
		label: 'Resting',
		surface: vars.color.surface.resting,
	},
	{
		description: 'Hovered controls and elevated surfaces',
		depth: vars.depth.raised,
		label: 'Raised',
		surface: vars.color.surface.resting,
	},
	{
		description: 'Menus and popovers',
		depth: vars.depth.floating,
		label: 'Floating',
		surface: vars.color.surface.floating,
	},
	{
		description: 'Dialogs and sheets',
		depth: vars.depth.overlay,
		label: 'Overlay',
		surface: vars.color.surface.overlay,
	},
] as const;

type ColorMode = 'dark' | 'light';

export default function DepthExample() {
	const [colorMode, setColorMode] = useState<ColorMode>('light');

	return (
		<Box display="grid" gap="400">
			<Box aria-label="Colour mode" display="flex" gap="200" role="group">
				{(['light', 'dark'] as const).map((option) => (
					<Button
						appearance={colorMode === option ? 'solid' : 'subtle'}
						aria-pressed={colorMode === option}
						key={option}
						onPress={() => setColorMode(option)}
						size="small"
						tone="accent"
					>
						{option === 'light' ? 'Light' : 'Dark'}
					</Button>
				))}
			</Box>
			<Box
				data-color-mode={colorMode}
				display="grid"
				gap="400"
				padding={{ medium: '600', xsmall: '300' }}
				style={{
					backgroundColor: vars.color.surface.canvas,
					borderRadius: vars.radius.surface,
					gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
				}}
			>
				{depthRoles.map((role) => (
					<Box
						key={role.label}
						padding="400"
						style={{
							backgroundColor: role.surface,
							border: `1px solid ${vars.color.border.decorative}`,
							borderRadius: vars.radius.surface,
							boxShadow: role.depth,
							color: vars.color.text.primary,
						}}
					>
						<Text elementType="strong" fontWeight="emphasis">
							{role.label}
						</Text>
						<Text color="secondary" elementType="p" size="200">
							{role.description}
						</Text>
					</Box>
				))}
			</Box>
		</Box>
	);
}
