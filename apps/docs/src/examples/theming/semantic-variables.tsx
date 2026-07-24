import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function SemanticVariablesExample() {
	return (
		<Box
			display="grid"
			gap="300"
			style={{
				gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
			}}
		>
			<PublicationStatus mode="light" />
			<PublicationStatus mode="dark" />
		</Box>
	);
}

function PublicationStatus({ mode }: { mode: 'light' | 'dark' }) {
	return (
		<Box
			aria-label={`Publication status in ${mode} mode`}
			data-color-mode={mode}
			padding="600"
			render={(props) => <section {...props} />}
			style={{
				backgroundColor: vars.color.surface.floating,
				border: `1px solid ${vars.color.border.decorative}`,
				borderRadius: vars.radius.surface,
				boxShadow: vars.depth.resting,
				color: vars.color.text.primary,
			}}
		>
			<Box display="flex" gap="300" justifyContent="space-between">
				<Text elementType="strong" fontWeight="emphasis">
					Release notes
				</Text>
				<Text color="secondary" elementType="span">
					{mode} mode
				</Text>
			</Box>
			<Box marginBlockStart="400">
				<Box
					display="inline-block"
					paddingBlock="100"
					paddingInline="200"
					render={(props) => <span {...props} />}
					style={{
						backgroundColor: vars.color.intent.success.surface.subtle,
						borderRadius: vars.radius.full,
						color: vars.color.intent.success.text,
					}}
				>
					Published
				</Box>
			</Box>
			<Text color="secondary" elementType="p">
				This custom surface follows the active theme and colour mode.
			</Text>
		</Box>
	);
}
