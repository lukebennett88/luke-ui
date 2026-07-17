import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';

export default function Standalone() {
	return (
		<Box display="flex" flexDirection="column" gap="400">
			<Text elementType="p">
				Read the <Link href="#release-notes">release notes</Link> before updating your workspace.
			</Text>
			<Link href="#manage-members" isStandalone>
				Manage members
			</Link>
		</Box>
	);
}
