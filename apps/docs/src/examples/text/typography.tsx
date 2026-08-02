import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { fontSizeSteps, vars } from '@luke-ui/react/theme';

export default function Typography() {
	return (
		<Box display="flex" flexDirection="column" gap="300">
			{fontSizeSteps.map((size) => (
				<Box
					alignItems="flex-end"
					display="grid"
					gap="300"
					key={size}
					style={{ gridTemplateColumns: '3rem minmax(0, 1fr)' }}
				>
					<Text color="secondary" elementType="div" size="100">
						{size}
					</Text>
					<Box style={{ borderBlockEnd: `1px dashed ${vars.color.border.decorative}` }}>
						<Text elementType="div" size={size}>
							Aa
						</Text>
					</Box>
				</Box>
			))}
		</Box>
	);
}
