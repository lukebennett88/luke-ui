import { Box } from '@luke-ui/react/box';
import { Strong } from '@luke-ui/react/strong';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Surface">
				<Box
					backgroundColor="surface.subdued"
					borderRadius="surface"
					columnGap="space.24"
					display="flex"
					flexWrap="wrap"
					padding="space.16"
					rowGap="space.8"
				>
					<Specimens />
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Subtle fill">
				<Box
					backgroundColor="accent.subtle"
					borderRadius="surface"
					columnGap="space.24"
					display="flex"
					flexWrap="wrap"
					padding="space.16"
					rowGap="space.8"
				>
					<Specimens />
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Solid fill">
				<Box
					backgroundColor="accent.solid"
					borderRadius="surface"
					columnGap="space.24"
					display="flex"
					flexWrap="wrap"
					padding="space.16"
					rowGap="space.8"
				>
					<Specimens />
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};

function Specimens() {
	return (
		<>
			<Text>Inherited</Text>
			<Text color="secondary">Secondary</Text>
			<Text color="danger">
				Danger with <Strong>emphasis</Strong>
			</Text>
		</>
	);
}
