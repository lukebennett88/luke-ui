import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { ReactNode } from 'react';

const intents = [
	{ color: vars.color.intent.accent.surface.solid, label: 'Accent' },
	{ color: vars.color.intent.success.surface.solid, label: 'Success' },
	{ color: vars.color.intent.danger.surface.solid, label: 'Danger' },
];

export default function IntentColoursExample() {
	return (
		<Box display="flex" flexWrap="wrap" gap="600">
			<TokenGroup label="Surfaces">
				<Box display="flex" gap="100">
					<Swatch color={vars.color.surface.canvas} label="Canvas" />
					<Swatch color={vars.color.surface.recessed} label="Recessed" />
					<Swatch color={vars.color.surface.resting} label="Resting" />
				</Box>
			</TokenGroup>
			<TokenGroup label="Content">
				<Box display="grid" gap="100">
					<Text elementType="span" fontWeight="label" size="200">
						Primary text
					</Text>
					<Text color="secondary" elementType="span" fontWeight="label" size="200">
						Secondary text
					</Text>
				</Box>
			</TokenGroup>
			<TokenGroup label="Intent">
				<Box display="flex" gap="100">
					{intents.map((intent) => (
						<Swatch key={intent.label} color={intent.color} label={intent.label} />
					))}
				</Box>
			</TokenGroup>
		</Box>
	);
}

function TokenGroup({ children, label }: { children: ReactNode; label: string }) {
	return (
		<Box display="grid" gap="200">
			<Text color="secondary" elementType="span" fontWeight="label" size="100">
				{label}
			</Text>
			{children}
		</Box>
	);
}

function Swatch({ color, label }: { color: string; label: string }) {
	return (
		<Box display="grid" gap="100" style={{ inlineSize: '4rem' }}>
			<Box
				aria-label={`${label} colour sample`}
				role="img"
				style={{
					backgroundColor: color,
					blockSize: '2rem',
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.detail,
					inlineSize: '2rem',
				}}
			/>
			<Text color="secondary" elementType="span" size="100">
				{label}
			</Text>
		</Box>
	);
}
