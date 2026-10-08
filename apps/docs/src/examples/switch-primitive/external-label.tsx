import { Box } from '@luke-ui/react/box';
import {
	SwitchControl,
	SwitchLabel,
	SwitchRoot,
	SwitchThumb,
} from '@luke-ui/react/primitives/switch';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useId } from 'react';

export default () => {
	const labelId = useId();
	const descriptionId = useId();

	return (
		<Box alignItems="center" display="flex" gap="sp12" maxInlineSize="24rem">
			<Stack flexGrow="1" gap="sp4">
				<Text id={labelId} typography="label">
					Example setting
				</Text>
				<Text color="secondary" id={descriptionId} typography="caption">
					The row draws this label and description.
				</Text>
			</Stack>
			<SwitchRoot aria-describedby={descriptionId} aria-labelledby={labelId}>
				<SwitchLabel>
					<SwitchControl>
						<SwitchThumb />
					</SwitchControl>
				</SwitchLabel>
			</SwitchRoot>
		</Box>
	);
};
