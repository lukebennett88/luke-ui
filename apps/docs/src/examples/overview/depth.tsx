import { Box } from '@luke-ui/react/box';
import { Grid, minmax, repeat } from '@luke-ui/react/grid';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Grid columns={repeat('auto-fit', minmax('min(6rem, 100%)', '1fr'))} gap="sp12" padding="sp16">
			{Object.entries(vars.depth).map(([name, depth]) => (
				<Stack gap="sp8" key={name}>
					<Box
						style={{
							backgroundColor: vars.color.surface.floating,
							blockSize: '5rem',
							border: `1px solid ${vars.color.border.control}`,
							borderRadius: vars.radius.surface,
							boxShadow: depth,
						}}
					/>
					<Text textAlign="center" typography="caption">
						{name}
					</Text>
				</Stack>
			))}
		</Grid>
	);
};
