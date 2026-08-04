import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

type ColorMode = 'dark' | 'light';

const OPPOSITE_MODE: Record<ColorMode, ColorMode> = {
	dark: 'light',
	light: 'dark',
};

export default () => {
	const [parentMode, setParentMode] = useState<ColorMode>('light');
	const nestedMode = OPPOSITE_MODE[parentMode];

	return (
		<Box
			data-color-mode={parentMode}
			display="grid"
			gap="400"
			padding="600"
			style={{
				backgroundColor: vars.color.surface.canvas,
				color: vars.color.text.primary,
			}}
		>
			<Box display="grid" gap="200">
				<Text elementType="strong" fontWeight="emphasis">
					Parent colour mode
				</Text>
				<Box aria-label="Parent colour mode" display="flex" gap="200" role="group">
					{(['light', 'dark'] as const).map((option) => (
						<Button
							appearance={parentMode === option ? 'solid' : 'subtle'}
							aria-pressed={parentMode === option}
							key={option}
							onPress={() => setParentMode(option)}
							tone="accent"
						>
							{option === 'light' ? 'Light' : 'Dark'}
						</Button>
					))}
				</Box>
			</Box>
			<Box
				padding="400"
				style={{
					backgroundColor: vars.color.surface.floating,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					color: vars.color.text.primary,
				}}
			>
				<Text>This panel follows the parent mode: {parentMode}.</Text>
			</Box>
			<Box
				data-color-mode={nestedMode}
				padding="400"
				style={{
					backgroundColor: vars.color.surface.floating,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					color: vars.color.text.primary,
				}}
			>
				<Text>This nested scope forces the opposite mode: {nestedMode}.</Text>
			</Box>
		</Box>
	);
};
