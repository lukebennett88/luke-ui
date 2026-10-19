import { Box } from '@luke-ui/react/box';
import { FieldDescription, FieldLabel } from '@luke-ui/react/primitives/field';
import {
	SwitchControl,
	SwitchLabel,
	SwitchRoot,
	SwitchThumb,
} from '@luke-ui/react/primitives/switch';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<SwitchRoot>
			<Box alignItems="center" display="flex" gap="space.12" maxInlineSize="24rem">
				<Stack flexGrow="1" gap="space.4">
					<FieldLabel>Example setting</FieldLabel>
					<FieldDescription>The row draws this label and description.</FieldDescription>
				</Stack>
				<SwitchLabel>
					<SwitchControl>
						<SwitchThumb />
					</SwitchControl>
				</SwitchLabel>
			</Box>
		</SwitchRoot>
	);
};
