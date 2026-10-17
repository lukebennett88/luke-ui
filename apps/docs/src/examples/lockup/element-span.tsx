import { Icon } from '@luke-ui/react/icon';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';

export default () => {
	return (
		<p>
			Example text with{' '}
			<Lockup elementType="span" gap="sp4">
				<LockupRail>
					<Icon name="checkCircle" />
				</LockupRail>
				<LockupBody>inline content</LockupBody>
			</Lockup>{' '}
			in the middle.
		</p>
	);
};
