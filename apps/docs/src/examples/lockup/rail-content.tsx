import { Kbd } from '@luke-ui/react/kbd';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Lockup gap="space.8">
			<LockupBody>Example command</LockupBody>
			<LockupRail>
				<Text color="secondary" typography="caption">
					Press <Kbd>K</Kbd>
				</Text>
			</LockupRail>
		</Lockup>
	);
};
