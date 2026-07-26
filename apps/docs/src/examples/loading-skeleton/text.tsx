import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';

export default function TextSkeleton() {
	return (
		<Box maxInlineSize="32rem">
			<Text>
				<LoadingSkeleton>
					The placeholder follows each line of text as this sentence wraps.
				</LoadingSkeleton>
			</Text>
		</Box>
	);
}
