import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="grid" gap="sp12">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Small
				</Text>
				<Checkbox defaultSelected size="small">
					Example checkbox
				</Checkbox>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Medium
				</Text>
				<Checkbox defaultSelected size="medium">
					Example checkbox
				</Checkbox>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Large
				</Text>
				<Checkbox defaultSelected size="large">
					Example checkbox
				</Checkbox>
			</Box>
		</Box>
	);
};
