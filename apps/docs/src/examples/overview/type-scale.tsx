import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

const sizes = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;
type TypeSize = (typeof sizes)[number];

const guidance: Record<TypeSize, string> = {
	100: 'Compact metadata and dense UI labels',
	200: 'Supporting labels and secondary detail',
	300: 'Default body copy and form content',
	400: 'Prominent body copy and lead-ins',
	500: 'Small section titles',
	600: 'Section headings',
	700: 'Page headings',
	800: 'Primary page titles',
	900: 'Display headings',
};

export default function TypeScaleExample() {
	const [selectedSize, setSelectedSize] = useState<TypeSize>('300');

	return (
		<Box display="grid" gap="600">
			<Box aria-label="Type size" display="flex" flexWrap="wrap" gap="200" role="group">
				{sizes.map((size) => (
					<Button
						appearance={selectedSize === size ? 'solid' : 'subtle'}
						aria-pressed={selectedSize === size}
						key={size}
						onPress={() => setSelectedSize(size)}
						size="small"
						tone="accent"
					>
						{size}
					</Button>
				))}
			</Box>
			<Box
				aria-live="polite"
				padding="600"
				style={{
					backgroundColor: vars.color.surface.resting,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.resting,
				}}
			>
				<Text color="secondary" elementType="span" fontWeight="label" size="200">
					{selectedSize} — {guidance[selectedSize]}
				</Text>
				<Box marginBlockStart="300">
					<Text fontWeight={selectedSize >= '500' ? 'heading' : 'body'} size={selectedSize}>
						The quick brown fox
					</Text>
				</Box>
			</Box>
			<Box display="grid" gap="300">
				{sizes.map((size) => (
					<Box alignItems="baseline" display="flex" gap="400" key={size}>
						<Text
							color="secondary"
							elementType="span"
							fontWeight="label"
							size="100"
							style={{ inlineSize: '2.5rem' }}
						>
							{size}
						</Text>
						<Text fontWeight={size >= '500' ? 'heading' : 'body'} size={size}>
							Ag 012
						</Text>
					</Box>
				))}
			</Box>
		</Box>
	);
}
