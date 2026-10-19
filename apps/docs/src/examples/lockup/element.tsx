import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';

const plainListStyle = { listStyle: 'none' } as const;

export default () => {
	return (
		<Box elementType="ul" margin="0" padding="0" style={plainListStyle}>
			<Lockup elementType="li" gap="space.8">
				<LockupRail>
					<Icon name="checkCircle" />
				</LockupRail>
				<LockupBody>First item</LockupBody>
			</Lockup>
			<Lockup elementType="li" gap="space.8">
				<LockupRail>
					<Icon name="checkCircle" />
				</LockupRail>
				<LockupBody>Second item</LockupBody>
			</Lockup>
		</Box>
	);
};
