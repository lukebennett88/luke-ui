import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

export default () => {
	const [parentMode, setParentMode] = useState<'light' | 'dark'>('light');

	return (
		<Box
			data-color-mode={parentMode}
			display="grid"
			gap="sp16"
			padding="sp24"
			style={{
				backgroundColor: vars.color.surface.canvas,
				color: vars.color.text.primary,
			}}
		>
			<Box display="grid" gap="sp8">
				<Text elementType="strong" fontWeight="emphasis">
					Parent colour mode
				</Text>
				<Box aria-label="Parent colour mode" display="flex" gap="sp8" role="group">
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
				padding="sp16"
				style={{
					backgroundColor: vars.color.surface.floating,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					color: vars.color.text.primary,
				}}
			>
				<Text>This panel follows the parent mode.</Text>
			</Box>
			<Box
				data-color-mode="dark"
				padding="sp16"
				style={{
					backgroundColor: vars.color.surface.floating,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					color: vars.color.text.primary,
				}}
			>
				<Text>This panel is fixed to dark mode.</Text>
			</Box>
		</Box>
	);
};
