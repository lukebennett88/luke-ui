import { Box } from '@luke-ui/react/box';

export default () => {
	return (
		<Box padding="sp16" render={(props) => <details {...props} open />}>
			<summary>More details</summary>
			<p>This content is revealed when the details element is expanded.</p>
		</Box>
	);
};
