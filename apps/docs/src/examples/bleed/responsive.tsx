import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { Stack } from '@luke-ui/react/stack';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Box
			backgroundColor="surface.recessed"
			borderColor="decorative"
			borderStyle="solid"
			borderWidth="thin"
			paddingBlock="sp16"
			paddingInline="sp16"
		>
			<Stack gap="sp16">
				<ExampleItem>Inset within the padding</ExampleItem>
				<Bleed inline={{ initial: 'sp16', bp640: '0' }}>
					<ExampleItem>Full bleed on narrow viewports, inset from bp640</ExampleItem>
				</Bleed>
			</Stack>
		</Box>
	);
};
