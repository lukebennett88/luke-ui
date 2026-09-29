import { AutoGrid } from '@luke-ui/react/auto-grid';
import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<AutoGrid gap="sp12" minColumnInlineSize="14rem">
			<SemanticSurface mode="light" />
			<SemanticSurface mode="dark" />
		</AutoGrid>
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
