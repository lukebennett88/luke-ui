import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';

export default () => {
	return (
		<Box display="grid" gap="sp12">
			<Checkbox defaultSelected size="small">
				Small
			</Checkbox>
			<Checkbox defaultSelected size="medium">
				Medium
			</Checkbox>
			<Checkbox defaultSelected size="large">
				Large
			</Checkbox>
		</Box>
	);
};
