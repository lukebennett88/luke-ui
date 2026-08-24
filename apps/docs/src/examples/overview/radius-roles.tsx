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

export default () => {
	return (
		<Box
			display="grid"
			gap="sp16"
			style={{
				gridTemplateColumns: 'repeat(auto-fit, minmax(5rem, 1fr))',
				inlineSize: '100%',
			}}
		>
			{radiusRoles.map((role) => (
				<Box display="grid" gap="sp8" key={role.label}>
					<DecorativeBox
						alignItems="center"
						display="flex"
						flexGrow="1"
						justifyContent="center"
						padding="sp8"
						style={{
							blockSize: '5rem',
							borderRadius: role.value,
						}}
					/>
					<Text typography="caption" style={{ textAlign: 'center' }}>
						{role.label}
					</Text>
				</Box>
			))}
		</Box>
	);
};
