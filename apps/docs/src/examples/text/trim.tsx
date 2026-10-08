import { Box } from '@luke-ui/react/box';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

const lineBoxStyle = {
	backgroundColor: vars.color.surface.recessed,
	borderBlock: `1px dashed ${vars.color.border.decorative}`,
} as const;

export default () => {
	const [isTrimmed, setIsTrimmed] = useState(true);

	return (
		<Stack gap="sp16">
			<CheckboxField isSelected={isTrimmed} label="Trim text" onChange={setIsTrimmed} />
			<Box paddingInline="sp12" style={lineBoxStyle}>
				<Text elementType="div" shouldDisableTrim={!isTrimmed} typography="display">
					Aa
				</Text>
			</Box>
		</Stack>
	);
};
