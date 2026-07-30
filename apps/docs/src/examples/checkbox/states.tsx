import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';

export default function States() {
	return (
		<Box display="grid" gap="300">
			<Checkbox>Unchecked</Checkbox>
			<Checkbox defaultSelected>Checked</Checkbox>
			<Checkbox isIndeterminate>Indeterminate</Checkbox>
			<Checkbox isDisabled>Disabled</Checkbox>
			<Checkbox errorMessage="Choose an option." isInvalid>
				Invalid
			</Checkbox>
		</Box>
	);
}
