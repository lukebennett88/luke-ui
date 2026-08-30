import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			<Box alignItems="center" display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					X-small
				</Text>
				<LoadingSpinner aria-label="Loading" size="xsmall" />
			</Box>
			<Box alignItems="center" display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Small
				</Text>
				<LoadingSpinner aria-label="Loading" size="small" />
			</Box>
			<Box alignItems="center" display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Medium
				</Text>
				<LoadingSpinner aria-label="Loading" size="medium" />
			</Box>
			<Box alignItems="center" display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Large
				</Text>
				<LoadingSpinner aria-label="Loading" size="large" />
			</Box>
		</Box>
	);
};
