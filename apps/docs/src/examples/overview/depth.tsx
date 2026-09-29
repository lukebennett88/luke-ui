import { AutoGrid } from '@luke-ui/react/auto-grid';
import { Box } from '@luke-ui/react/box';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<AutoGrid gap="sp12" minColumnInlineSize="6rem" padding="sp16">
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
		</AutoGrid>
	);
};
