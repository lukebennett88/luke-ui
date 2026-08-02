import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { useState } from 'react';
import { DecorativeBox } from './decorative-box.js';

const spacingSteps = [100, 200, 300, 400, 600, 800, 1000, 1200, 1600] as const;

type SpacingStep = (typeof spacingSteps)[number];

export default function SpacingPickerExample() {
	const [step, setStep] = useState<SpacingStep>(400);

	return (
		<Box display="grid" gap="400">
			<Box aria-label="Spacing step" display="flex" flexWrap="wrap" gap="200" role="group">
				{spacingSteps.map((option) => (
					<Button
						appearance={step === option ? 'solid' : 'subtle'}
						aria-pressed={step === option}
						key={option}
						onPress={() => setStep(option)}
						size="small"
					>
						{option}
					</Button>
				))}
			</Box>
			<Box display="flex" gap={`${step}`}>
				<DecorativeBox style={{ blockSize: '3rem', inlineSize: '3rem' }} />
				<DecorativeBox style={{ blockSize: '3rem', inlineSize: '3rem' }} />
				<DecorativeBox style={{ blockSize: '3rem', inlineSize: '3rem' }} />
			</Box>
		</Box>
	);
}
