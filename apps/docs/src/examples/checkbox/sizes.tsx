import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';

export default function Sizes() {
	return (
		<Box display="grid" gap="300">
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
}
