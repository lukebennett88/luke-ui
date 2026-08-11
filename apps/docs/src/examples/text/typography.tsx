import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { typeStyles, vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="300">
			{typeStyles.map((typography) => (
				<Box
					alignItems="flex-end"
					display="grid"
					gap="300"
					key={typography}
					style={{ gridTemplateColumns: '6rem minmax(0, 1fr)' }}
				>
					<Text color="secondary" elementType="div" typography="caption">
						{typography}
					</Text>
					<Box style={{ borderBlockEnd: `1px dashed ${vars.color.border.decorative}` }}>
						<Text elementType="div" typography={typography}>
							Aa
						</Text>
					</Box>
				</Box>
			))}
		</Box>
	);
};
