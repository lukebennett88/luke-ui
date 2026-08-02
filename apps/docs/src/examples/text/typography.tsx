import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import type { TextProps } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

type Size = NonNullable<TextProps['size']>;

const sizes = [
	'100',
	'200',
	'300',
	'400',
	'500',
	'600',
	'700',
	'800',
	'900',
] as const satisfies ReadonlyArray<Size>;

export default function Typography() {
	return (
		<Box>
			<Box
				alignItems="flex-end"
				display="grid"
				style={{
					borderBlockEnd: `1px dashed ${vars.color.border.decorative}`,
					gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
				}}
			>
				{sizes.map((size) => (
					<Text elementType="div" key={size} size={size} textAlign="center">
						Aa
					</Text>
				))}
			</Box>
			<Box
				display="grid"
				paddingBlockStart="200"
				style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}
			>
				{sizes.map((size) => (
					<Text color="secondary" elementType="div" key={size} size="100" textAlign="center">
						{size}
					</Text>
				))}
			</Box>
		</Box>
	);
}
