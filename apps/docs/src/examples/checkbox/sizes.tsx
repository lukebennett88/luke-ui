import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';

export default function Sizes() {
	return (
		<Box display="grid" gap="300">
			<Checkbox defaultSelected size="small">
				Small checkbox
			</Checkbox>
			<Checkbox defaultSelected size="medium">
				Medium checkbox
			</Checkbox>
			<Checkbox defaultSelected size="large">
				Large checkbox
			</Checkbox>
		</Box>
	);
}
