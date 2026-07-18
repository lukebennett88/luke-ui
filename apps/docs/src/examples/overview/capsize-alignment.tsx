import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import type { TextSize } from '@luke-ui/react/recipes';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

const sizes = ['300', '500', '700'] as const satisfies ReadonlyArray<TextSize>;
type TypeSize = (typeof sizes)[number];

export default function CapsizeAlignmentExample() {
	const [size, setSize] = useState<TypeSize>('500');

	return (
		<Box display="grid" gap="600">
			<Box aria-label="Capsize comparison size" display="flex" gap="200" role="group">
				{sizes.map((option) => (
					<Button
						appearance={size === option ? 'solid' : 'subtle'}
						aria-pressed={size === option}
						key={option}
						onPress={() => setSize(option)}
						size="small"
						tone="accent"
					>
						{option}
					</Button>
				))}
			</Box>
			<Box
				display="grid"
				gap="400"
				style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))' }}
			>
				<TrimPanel isTrimmed size={size} />
				<TrimPanel isTrimmed={false} size={size} />
			</Box>
			<Box
				padding="600"
				style={{
					backgroundColor: vars.color.surface.recessed,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
				}}
			>
				<Text elementType="strong" fontWeight="emphasis">
					Baseline alignment
				</Text>
				<Box alignItems="baseline" display="flex" flexWrap="wrap" gap="300" marginBlockStart="300">
					<Text
						color="secondary"
						elementType="span"
						size="200"
						style={{ borderBlockEnd: `1px solid ${vars.color.border.decorative}` }}
					>
						Supporting text
					</Text>
					<Text
						elementType="span"
						fontWeight="heading"
						size={size}
						style={{ borderBlockEnd: `1px solid ${vars.color.border.decorative}` }}
					>
						Ag 012
					</Text>
					<Text
						color="secondary"
						elementType="span"
						size="200"
						style={{ borderBlockEnd: `1px solid ${vars.color.border.decorative}` }}
					>
						shares this baseline
					</Text>
				</Box>
			</Box>
		</Box>
	);
}

function TrimPanel({ isTrimmed, size }: { isTrimmed: boolean; size: TypeSize }) {
	return (
		<Box
			padding="600"
			style={{
				backgroundColor: vars.color.surface.resting,
				border: `1px solid ${vars.color.border.decorative}`,
				borderRadius: vars.radius.surface,
				boxShadow: vars.depth.resting,
			}}
		>
			<Text color="secondary" elementType="span" fontWeight="label" size="200">
				{isTrimmed ? 'Capsize trim enabled' : 'Trim disabled'}
			</Text>
			<Box marginBlock="600">
				<Text
					elementType="span"
					fontWeight="heading"
					shouldDisableTrim={!isTrimmed}
					size={size}
					style={{ borderBlockEnd: `1px solid ${vars.color.border.decorative}` }}
				>
					Ag 012
				</Text>
			</Box>
			<Text color="secondary" elementType="p" size="200">
				{isTrimmed
					? 'The rule follows the trimmed text edge.'
					: 'The rule follows the font’s untrimmed line box.'}
			</Text>
		</Box>
	);
}
