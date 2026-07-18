import { Box } from '@luke-ui/react/box';
import type { TextSize } from '@luke-ui/react/recipes';
import { Text } from '@luke-ui/react/text';

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
] as const satisfies ReadonlyArray<TextSize>;
type TypeSize = (typeof sizes)[number];

export default function TypeScaleExample() {
	return (
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
					<TypeSpecimen size={size}>The quick brown fox</TypeSpecimen>
				</Box>
			))}
		</Box>
	);
}

function TypeSpecimen({ children, size }: { children: string; size: TypeSize }) {
	return (
		<Text elementType="span" fontWeight={Number(size) >= 500 ? 'heading' : 'body'} size={size}>
			{children}
		</Text>
	);
}
