import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="grid" gap="sp12">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Unchecked
				</Text>
				<Checkbox>Email notifications</Checkbox>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Checked
				</Text>
				<Checkbox defaultSelected>Email notifications</Checkbox>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Indeterminate
				</Text>
				<Checkbox isIndeterminate>Email notifications</Checkbox>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Disabled
				</Text>
				<Checkbox isDisabled>Email notifications</Checkbox>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Disabled and checked
				</Text>
				<Checkbox defaultSelected isDisabled>
					Email notifications
				</Checkbox>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Invalid
				</Text>
				<Checkbox errorMessage="Choose whether to receive email notifications.">
					Email notifications
				</Checkbox>
			</Box>
		</Box>
	);
};
