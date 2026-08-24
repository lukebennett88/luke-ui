import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { typeStyles, vars } from '@luke-ui/react/theme';
import { Fragment } from 'react';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp12">
			<Box
				alignItems="flex-end"
				display="grid"
				elementType="dl"
				gap="sp12"
				style={{ gridTemplateColumns: 'max-content minmax(0, 1fr)' }}
			>
				{typeStyles.map((typography) => (
					<Fragment key={typography}>
						<Text color="secondary" elementType="dt" typography="caption">
							{typography}
						</Text>
						<Box
							elementType="dd"
							style={{ borderBlockEnd: `1px dashed ${vars.color.border.decorative}` }}
						>
							<Text elementType="div" typography={typography}>
								Aa
							</Text>
						</Box>
					</Fragment>
				))}
			</Box>
		</Box>
	);
};
