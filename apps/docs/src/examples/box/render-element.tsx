import { Box } from '@luke-ui/react/box';

export default () => {
	return (
		<Box padding="sp16" render={(props) => <details {...props} open />}>
			<summary>Delivery details</summary>
			<p>Your order will arrive within three business days.</p>
		</Box>
	);
};
