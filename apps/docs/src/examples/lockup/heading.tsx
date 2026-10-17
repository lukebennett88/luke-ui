import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';

export default () => {
	return (
		<Box maxInlineSize="18rem">
			<Heading level={2}>
				<Lockup elementType="span" gap="sp8">
					<LockupRail>
						<Icon name="search" />
					</LockupRail>
					<LockupBody>Example heading that wraps onto a second line</LockupBody>
				</Lockup>
			</Heading>
		</Box>
	);
};
