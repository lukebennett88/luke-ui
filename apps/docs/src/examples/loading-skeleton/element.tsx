import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<Stack elementType="ul" gap="space.8" listStyle="none" margin="0" padding="0">
			<LoadingSkeleton elementType="li">List item 1</LoadingSkeleton>
			<LoadingSkeleton elementType="li">List item 2</LoadingSkeleton>
			<LoadingSkeleton elementType="li">List item 3</LoadingSkeleton>
		</Stack>
	);
};
