import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Stack } from '@luke-ui/react/stack';

const plainListStyle = { listStyle: 'none' } as const;

export default () => {
	return (
		<Stack elementType="ul" gap="space.8" margin="0" padding="0" style={plainListStyle}>
			<LoadingSkeleton elementType="li">List item 1</LoadingSkeleton>
			<LoadingSkeleton elementType="li">List item 2</LoadingSkeleton>
			<LoadingSkeleton elementType="li">List item 3</LoadingSkeleton>
		</Stack>
	);
};
