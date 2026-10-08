import {
	CheckboxControl,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxRoot,
} from '@luke-ui/react/primitives/checkbox';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<CheckboxRoot>
			<CheckboxLabel>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				<Stack gap="sp4">
					<Text slot={null} typography="label">
						Example checkbox
					</Text>
					<Text color="secondary" slot={null} typography="caption">
						Supporting text inside the label
					</Text>
				</Stack>
			</CheckboxLabel>
		</CheckboxRoot>
	);
};
