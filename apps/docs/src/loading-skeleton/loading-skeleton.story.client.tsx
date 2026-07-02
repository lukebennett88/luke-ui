import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './loading-skeleton.story';

function Story(props: React.ComponentProps<typeof LoadingSkeleton>) {
	return (
		<div style={{ maxWidth: '30ch' }}>
			<Text>
				<LoadingSkeleton {...props} />
			</Text>
		</div>
	);
}

export const storyClient = createWrappedStoryClient<typeof story>(Story);
