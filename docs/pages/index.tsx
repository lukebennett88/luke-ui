import { Button } from '@luke-ui/button';

import { Box } from '../components/box';

export default function Docs() {
	return (
		<Box
			display="flex"
			flexDirection="column"
			gap="medium"
			background="lightBlue"
			color="darkGray"
			alignItems="flex-start"
			padding="large"
		>
			<Box as="h1">Docs</Box>
			<Button>Boop</Button>
		</Box>
	);
}
