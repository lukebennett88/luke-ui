import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Link href="#view-report">View report</Link>
			<Link href="#view-report" tone="neutral">
				View report
			</Link>
		</Box>
	);
};
