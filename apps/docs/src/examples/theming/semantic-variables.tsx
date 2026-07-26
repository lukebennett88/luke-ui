import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function SemanticVariablesExample() {
	return (
		<Box
			display="grid"
			gap="300"
			style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}
		>
			<SemanticSurface mode="light" />
			<SemanticSurface mode="dark" />
		</Box>
	);
}

function SemanticSurface({ mode }: { mode: 'light' | 'dark' }) {
	return (
		<Box
			data-color-mode={mode}
			padding="400"
			style={{
				backgroundColor: vars.color.surface.floating,
				color: vars.color.text.primary,
			}}
		>
			<Text>{mode === 'light' ? 'Light' : 'Dark'}</Text>
		</Box>
	);
}
