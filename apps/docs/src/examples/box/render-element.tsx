import { Box } from '@luke-ui/react/box';

export default function Example() {
	return (
		<Box padding="sp16" renderRoot={(props) => <details {...props} open />}>
			<summary>Owned details element</summary>
			Box passes resolved root props, including children, className, style, and ref, into
			renderRoot.
		</Box>
	);
}
