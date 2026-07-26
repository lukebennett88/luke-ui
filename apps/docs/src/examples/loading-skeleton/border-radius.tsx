import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { TextField } from '@luke-ui/react/text-field';

export default function BorderRadius() {
	return (
		<Box maxInlineSize="20rem">
			<LoadingSkeleton radius="control">
				<TextField label="Email address" name="email" placeholder="you@example.com" />
			</LoadingSkeleton>
		</Box>
	);
}
