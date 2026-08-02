import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { Fragment } from 'react';

const spacingSteps = [100, 200, 300, 400, 600, 800, 1000, 1200, 1600] as const;

export default function SpacingScaleExample() {
	return (
		<Box
			alignItems="center"
			columnGap="400"
			display="grid"
			overflowX="auto"
			rowGap="300"
			style={{ gridTemplateColumns: 'auto 1fr', inlineSize: '100%' }}
		>
			{spacingSteps.map((step) => (
				<Fragment key={step}>
					<Text elementType="span" fontVariantNumeric="tabular-nums" size="100">
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
}
