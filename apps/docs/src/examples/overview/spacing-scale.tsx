import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { Fragment } from 'react';

const spacingSteps = Object.keys(vars.space) as Array<keyof typeof vars.space>;

export default () => {
	return (
		<Box
			alignItems="center"
			columnGap="sp16"
			display="grid"
			overflowX="auto"
			rowGap="sp12"
			style={{ gridTemplateColumns: 'auto 1fr' }}
		>
			{spacingSteps.map((step) => (
				<Fragment key={step}>
					<Text elementType="span" fontVariantNumeric="tabular-nums" typography="caption">
						{step}
					</Text>
					<Box
						style={{
							backgroundColor: vars.color.background.accent.solid.rest,
							blockSize: '1.5rem',
							borderRadius: vars.radius.detail,
							inlineSize: vars.space[step],
							minInlineSize: vars.space[step],
						}}
					/>
				</Fragment>
			))}
		</Box>
	);
};
