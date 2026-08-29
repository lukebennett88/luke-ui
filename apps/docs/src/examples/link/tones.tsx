import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Link href="#default">Default tone</Link>
			<Link href="#neutral" tone="neutral">
				Neutral tone
			</Link>
		</Box>
	);
};
