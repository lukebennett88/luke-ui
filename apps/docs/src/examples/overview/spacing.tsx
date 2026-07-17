import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

const steps = ['100', '200', '300', '400', '600', '800', '1000', '1200', '1600'] as const;
type SpaceStep = (typeof steps)[number];

export default function SpacingExample() {
	const [compactGap, setCompactGap] = useState<SpaceStep>('300');

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
			<Box aria-label="Compact gap" display="flex" flexWrap="wrap" gap="200" role="group">
				{(['100', '300', '600'] as const).map((step) => (
					<Button
						appearance={compactGap === step ? 'solid' : 'subtle'}
						aria-pressed={compactGap === step}
						key={step}
						onPress={() => setCompactGap(step)}
						size="small"
						tone="accent"
					>
						Compact gap {step}
					</Button>
				))}
			</Box>
			<Box
				display="flex"
				flexDirection={{ medium: 'row', xsmall: 'column' }}
				gap={{ medium: '800', xsmall: compactGap }}
				padding={{ medium: '600', xsmall: '300' }}
				style={{
					backgroundColor: vars.color.surface.resting,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.resting,
				}}
			>
				<ContentBlock title="Compact layout" />
				<ContentBlock title="Medium and wider" />
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
				The selected gap applies until medium, where the layout uses step 800.
			</Text>
		</Box>
	);
}
