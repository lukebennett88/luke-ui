import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

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
				{Object.entries(vars.depth).map(([name, depth]) => (
					<Box
						key={name}
						padding="400"
						style={{
							backgroundColor: vars.color.surface.resting,
							border: `1px solid ${vars.color.border.decorative}`,
							borderRadius: vars.radius.surface,
							boxShadow: depth,
							color: vars.color.text.primary,
						}}
					>
						<Text elementType="strong" fontWeight="emphasis">
							{name}
						</Text>
					</Box>
				))}
			</Box>
		</Box>
	);
}
