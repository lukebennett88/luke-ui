import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';

export default () => {
	return (
		<Container maxInlineSize="ct672" paddingInline="sp16">
			<Box
				backgroundColor="surface.floating"
				borderColor="decorative"
				borderRadius="detail"
				borderStyle="solid"
				borderWidth="thin"
				padding="sp16"
			>
				Content stays centred and has a 672px maximum inline size.
			</Box>
		</Container>
	);
};
