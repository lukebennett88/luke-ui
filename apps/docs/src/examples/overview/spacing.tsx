import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

type SpaceContractStep = `${keyof typeof vars.space}`;
const compactGaps = [
	{ step: '100', value: '4px' },
	{ step: '300', value: '12px' },
	{ step: '600', value: '24px' },
] as const satisfies ReadonlyArray<{ step: SpaceContractStep; value: string }>;
const steps = [
	'100',
	'200',
	'300',
	'400',
	'600',
	'800',
	'1000',
	'1200',
	'1600',
] as const satisfies ReadonlyArray<SpaceContractStep>;
type CompactGap = (typeof compactGaps)[number];

export default function SpacingExample() {
	const [compactGap, setCompactGap] = useState<CompactGap>(compactGaps[1]);

	return (
		<Box display="grid" gap="600">
			<Box display="grid" gap="200">
				{steps.map((step) => (
					<Box alignItems="center" display="flex" gap="300" key={step}>
						<Text
							color="secondary"
							elementType="span"
							fontWeight="label"
							size="200"
							style={{ inlineSize: '3rem' }}
						>
							{step}
						</Text>
						<Box
							style={{
								backgroundColor: vars.color.intent.accent.surface.solid,
								blockSize: '0.75rem',
								borderRadius: vars.radius.full,
								inlineSize: vars.space[step],
							}}
						/>
					</Box>
				))}
			</Box>
			<Box aria-label="Gap" display="flex" flexWrap="wrap" gap="200" role="group">
				{compactGaps.map((gap) => (
					<Button
						appearance={compactGap.step === gap.step ? 'solid' : 'subtle'}
						aria-pressed={compactGap.step === gap.step}
						key={gap.step}
						onPress={() => setCompactGap(gap)}
						size="small"
						tone="accent"
					>
						Gap {gap.step} ({gap.value})
					</Button>
				))}
			</Box>
			<Box
				display="grid"
				gap={compactGap.step}
				padding="300"
				style={{
					backgroundColor: vars.color.surface.resting,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.resting,
				}}
			>
				<ContentBlock title={`Selected gap: ${compactGap.step} (${compactGap.value})`} />
				<ContentBlock title="The same layout token separates these blocks." />
			</Box>
		</Box>
	);
}

function ContentBlock({ title }: { title: string }) {
	return (
		<Box display="grid" gap="100">
			<Text elementType="strong" fontWeight="emphasis">
				{title}
			</Text>
			<Text color="secondary" elementType="span" size="200">
				Choose a gap to compare its actual size.
			</Text>
		</Box>
	);
}
