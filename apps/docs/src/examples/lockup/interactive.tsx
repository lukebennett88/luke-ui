import { IconButton } from '@luke-ui/react/icon-button';
import { Link } from '@luke-ui/react/link';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Lockup gap="sp12">
			<LockupBody>
				<Stack gap="sp4">
					<Link href="#example-destination">Example destination</Link>
					<Text color="secondary" typography="caption">
						Example description
					</Text>
				</Stack>
			</LockupBody>
			<LockupRail>
				<IconButton aria-label="More options" icon="chevronDown" size="small" />
			</LockupRail>
		</Lockup>
	);
};
