import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useId, useState } from 'react';

export default () => {
	const [parentMode, setParentMode] = useState<'light' | 'dark'>('light');
	const labelId = useId();

	return (
		<Box backgroundColor="surface.base" data-color-mode={parentMode} padding="space.24">
			<Stack gap="space.16">
				<Stack gap="space.8">
					<Text elementType="strong" fontWeight="emphasis" id={labelId}>
						Parent colour mode
					</Text>
					<Cluster aria-labelledby={labelId} gap="space.8" role="group">
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
					backgroundColor="surface.subdued"
					borderColor="decorative"
					borderRadius="surface"
					borderStyle="solid"
					borderWidth="thin"
					padding="space.16"
				>
					<Text>This panel follows the parent mode.</Text>
				</Box>
				<Box
					backgroundColor="surface.subdued"
					borderColor="decorative"
					borderRadius="surface"
					borderStyle="solid"
					borderWidth="thin"
					data-color-mode="dark"
					padding="space.16"
				>
					<Text>This panel is fixed to dark mode.</Text>
				</Box>
			</Stack>
		</Box>
	);
};
