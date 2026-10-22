import { Bleed } from '@luke-ui/react/bleed';
import { Stack } from '@luke-ui/react/stack';
import { Comparison, ComparisonItem, ExampleItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Without bleed">
				<Stack gap="space.16">
					<ExampleItem>First item</ExampleItem>
					<ExampleItem backgroundColor="info.subtle">Middle item</ExampleItem>
					<ExampleItem>Last item</ExampleItem>
				</Stack>
			</ComparisonItem>
			<ComparisonItem label="With block bleed">
				<Stack gap="space.16">
					<ExampleItem>First item</ExampleItem>
					<Bleed block="space.24" position="relative">
						<ExampleItem backgroundColor="info.subtle">Middle item</ExampleItem>
					</Bleed>
					<ExampleItem>Last item</ExampleItem>
				</Stack>
			</ComparisonItem>
		</Comparison>
	);
};
