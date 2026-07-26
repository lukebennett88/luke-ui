import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

const sizes = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

export default function Typography() {
	return (
		<Box overflowX="auto">
			<Box minInlineSize="45rem">
				<Box
					alignItems="baseline"
					display="grid"
					style={{
						borderBlockEnd: `1px dashed ${vars.color.border.decorative}`,
						gridTemplateColumns: 'repeat(9, minmax(5rem, 1fr))',
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
					style={{ gridTemplateColumns: 'repeat(9, minmax(5rem, 1fr))' }}
				>
					{sizes.map((size) => (
						<Text color="secondary" elementType="div" key={size} size="100" textAlign="center">
							{size}
						</Text>
					))}
				</Box>
			</Box>
		</Box>
	);
}
