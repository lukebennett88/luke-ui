import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Stack inlineSize="100%" maxInlineSize="20rem">
			<Track
				gap="sp12"
				railAlignment="center"
				railStart={<Avatar name="Boricio Jones" />}
				railEnd={<Button size="small">View details</Button>}
			>
				<Stack gap="sp4">
					<Text fontWeight="emphasis">Boricio Jones</Text>
					<Text typography="caption">Product designer</Text>
				</Stack>
			</Track>
		</Stack>
	);
};

function Avatar({ name }: { name: string }) {
	const initials = name
		.split(' ')
		.map((name) => name[0])
		.join('');
	return (
		<Box
			alignItems="center"
			aria-hidden="true"
			backgroundColor="neutral.subtle.rest"
			blockSize="3rem"
			borderRadius="full"
			display="flex"
			inlineSize="3rem"
			justifyContent="center"
			render={(domProps) => <Text typography="heading4" {...domProps} />}
		>
			{initials}
		</Box>
	);
}
