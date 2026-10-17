import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';

export default () => {
	return (
		<Box maxInlineSize="20rem">
			<Lockup gap="sp8">
				<LockupRail>
					<Icon name="exclamationTriangle" />
				</LockupRail>
				<LockupBody>
					Example message that wraps onto multiple lines when the available space is limited.
				</LockupBody>
				<LockupRail>
					<IconButton aria-label="More options" icon="chevronDown" size="px32" />
				</LockupRail>
			</Lockup>
		</Box>
	);
};
