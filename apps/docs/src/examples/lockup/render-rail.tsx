import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';

export default () => {
	return (
		<Lockup gap="space.8">
			<LockupBody>Example event</LockupBody>
			<LockupRail renderRoot={(domProps) => <time {...domProps} dateTime="2026-10-17" />}>
				17 Oct
			</LockupRail>
		</Lockup>
	);
};
