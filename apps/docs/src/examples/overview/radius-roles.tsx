import { AutoGrid } from '@luke-ui/react/auto-grid';
import { Stack } from '@luke-ui/react/stack';
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
		<AutoGrid gap="sp16" minColumnInlineSize="5rem">
			{radiusRoles.map((role) => (
				<Stack gap="sp8" key={role.label}>
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
					<Text textAlign="center" typography="caption">
						{role.label}
					</Text>
				</Stack>
			))}
		</AutoGrid>
	);
};
