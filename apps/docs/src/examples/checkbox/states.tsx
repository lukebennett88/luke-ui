import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';

export default () => {
	return (
		<Box display="grid" gap="300">
			<Checkbox>Unchecked</Checkbox>
			<Checkbox defaultSelected>Checked</Checkbox>
			<Checkbox isIndeterminate>Indeterminate</Checkbox>
			<Checkbox isDisabled>Disabled</Checkbox>
			<Checkbox defaultSelected isDisabled>
				Disabled and checked
			</Checkbox>
			<Checkbox errorMessage="Accept the terms of service before you continue.">Invalid</Checkbox>
		</Box>
	);
};
