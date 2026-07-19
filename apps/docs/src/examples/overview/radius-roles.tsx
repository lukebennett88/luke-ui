import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { DecorativeBox } from './decorative-box.js';

const radiusRoles = [
	{ label: 'Detail', value: vars.radius.detail },
	{ label: 'Control', value: vars.radius.control },
	{ label: 'Surface', value: vars.radius.surface },
	{ label: 'Overlay', value: vars.radius.overlay },
	{ label: 'Full', value: vars.radius.full },
] as const;

export default function RadiusRolesExample() {
	return (
		<Box
			display="grid"
			gap="400"
			style={{
				gridTemplateColumns: 'repeat(auto-fit, minmax(5rem, 1fr))',
				inlineSize: '100%',
			}}
		>
			{radiusRoles.map((role) => (
				<Box display="grid" gap="200" key={role.label}>
					<DecorativeBox
						alignItems="center"
						display="flex"
						justifyContent="center"
						padding="200"
						flexGrow="1"
						style={{
							borderRadius: role.value,
							blockSize: '5rem',
						}}
					/>
					<Text size="100" style={{ textAlign: 'center' }}>
						{role.label}
					</Text>
				</Box>
			))}
		</Box>
	);
}
