import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
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
		<Box display="flex" flexDirection="column" gap="400">
			<Checkbox isSelected={isTrimmed} onChange={setIsTrimmed}>
				Trim text
			</Checkbox>
			<Box paddingInline="300" style={lineBoxStyle}>
				<Text elementType="div" shouldDisableTrim={!isTrimmed} typography="display">
					Aa
				</Text>
			</Box>
		</Box>
	);
};
