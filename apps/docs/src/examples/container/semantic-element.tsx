import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';

export default () => {
	return (
		<Container elementType="main" maxInlineSize="ct672" paddingInline="sp16">
			<Box
				backgroundColor="surface.floating"
				borderColor="decorative"
				borderRadius="detail"
				borderStyle="solid"
				borderWidth="thin"
				padding="sp16"
			>
				Main page content
			</Box>
		</Container>
	);
};
