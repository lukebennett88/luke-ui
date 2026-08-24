import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Box
			display="grid"
			gap="sp12"
			style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}
		>
			<SemanticSurface mode="light" />
			<SemanticSurface mode="dark" />
		</Box>
	);
};

function SemanticSurface({ mode }: { mode: 'light' | 'dark' }) {
	return (
		<Box
			data-color-mode={mode}
			padding="sp16"
			style={{
				backgroundColor: vars.color.surface.floating,
				color: vars.color.text.primary,
			}}
		>
			<Text>{mode === 'light' ? 'Light' : 'Dark'}</Text>
		</Box>
	);
}
