import { Box } from '@luke-ui/react/box';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Lockup gap="sp12" railAlignment="center">
			<LockupRail>
				<Box
					backgroundColor="neutral.subtle.rest"
					blockSize="3rem"
					borderRadius="full"
					inlineSize="3rem"
				/>
			</LockupRail>
			<LockupBody>
				<Stack gap="sp4">
					<Text fontWeight="emphasis">Example name</Text>
					<Text typography="caption">Example description</Text>
				</Stack>
			</LockupBody>
		</Lockup>
	);
};
