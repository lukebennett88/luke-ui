import { Box } from '@luke-ui/react/box';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { Fragment } from 'react';

const typographyStyles = (Object.keys(vars.font) as Array<keyof typeof vars.font>).filter(
	(key): key is Exclude<keyof typeof vars.font, 'family' | 'weight'> =>
		key !== 'family' && key !== 'weight',
);

export default () => {
	return (
		<Stack gap="sp12">
			<Box
				alignItems="flex-end"
				display="grid"
				elementType="dl"
				gap="sp12"
				style={{ gridTemplateColumns: 'max-content minmax(0, 1fr)' }}
			>
				{typographyStyles.map((typography) => (
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
		</Stack>
	);
};
