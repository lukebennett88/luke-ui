import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useId, useState } from 'react';

export default () => {
	const [parentMode, setParentMode] = useState<'light' | 'dark'>('light');
	const labelId = useId();

	return (
		<Box
			backgroundColor="surface.canvas"
			color={vars.color.text.primary}
			data-color-mode={parentMode}
			padding="sp24"
		>
			<Stack gap="sp16">
				<Stack gap="sp8">
					<Text elementType="strong" fontWeight="emphasis" id={labelId}>
						Parent colour mode
					</Text>
					<Cluster aria-labelledby={labelId} gap="sp8" role="group">
						{(['light', 'dark'] as const).map((option) => (
							<Button
								aria-pressed={parentMode === option}
								key={option}
								onPress={() => setParentMode(option)}
								prominence={parentMode === option ? 'high' : 'standard'}
							>
								{option === 'light' ? 'Light' : 'Dark'}
							</Button>
						))}
					</Cluster>
				</Stack>
				<Box
					backgroundColor="surface.floating"
					borderColor="decorative"
					borderRadius="surface"
					borderStyle="solid"
					borderWidth="thin"
					color={vars.color.text.primary}
					padding="sp16"
				>
					<Text>This panel follows the parent mode.</Text>
				</Box>
				<Box
					backgroundColor="surface.floating"
					borderColor="decorative"
					borderRadius="surface"
					borderStyle="solid"
					borderWidth="thin"
					color={vars.color.text.primary}
					data-color-mode="dark"
					padding="sp16"
				>
					<Text>This panel is fixed to dark mode.</Text>
				</Box>
			</Stack>
		</Box>
	);
};
