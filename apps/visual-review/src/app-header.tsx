import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { repository } from './config.js';

export function AppHeader() {
	return (
		<Box
			alignItems="center"
			backgroundColor="surface.base"
			borderBlockEndWidth="thin"
			borderColor="decorative"
			borderStyle="solid"
			borderWidth="none"
			display="flex"
			elementType="header"
			flexShrink="0"
			gap="space.16"
			justifyContent="space-between"
			paddingBlock="space.12"
			paddingInline="space.16"
		>
			<Text fontWeight="label">
				<Link href={window.location.pathname}>Visual review</Link>
			</Text>
			<Link
				appearance="button"
				endContent={<Icon name="externalLink" size="small" />}
				href={`https://github.com/${repository}/pulls`}
				prominence="low"
				size="small"
				target="_blank"
			>
				{repository}
			</Link>
		</Box>
	);
}
