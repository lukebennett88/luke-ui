import { Box } from '@luke-ui/react/box';
import { Grid } from '@luke-ui/react/grid';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Grid columns="repeat(auto-fit, minmax(min(14rem, 100%), 1fr))" gap="sp12">
			<SemanticSurface mode="light" />
			<SemanticSurface mode="dark" />
		</Grid>
	);
};

function SemanticSurface({ mode }: { mode: 'light' | 'dark' }) {
	return (
		<Box
			backgroundColor="surface.floating"
			color={vars.color.text.primary}
			data-color-mode={mode}
			padding="sp16"
		>
			<Text>{mode === 'light' ? 'Light' : 'Dark'}</Text>
		</Box>
	);
}
