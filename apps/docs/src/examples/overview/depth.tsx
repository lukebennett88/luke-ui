import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Box
			display="grid"
			gap="sp12"
			padding="sp16"
			style={{
				gridTemplateColumns: 'repeat(auto-fit, minmax(6rem, 1fr))',
				inlineSize: '100%',
			}}
		>
			{Object.entries(vars.depth).map(([name, depth]) => (
				<Box display="grid" gap="sp8" key={name}>
					<Box
						style={{
							backgroundColor: vars.color.surface.floating,
							blockSize: '5rem',
							border: `1px solid ${vars.color.border.control}`,
							borderRadius: vars.radius.surface,
							boxShadow: depth,
						}}
					/>
					<Text typography="caption" style={{ textAlign: 'center' }}>
						{name}
					</Text>
				</Box>
			))}
		</Box>
	);
};
