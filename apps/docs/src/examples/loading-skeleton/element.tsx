import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';

export default function ElementSkeleton() {
	return (
		<ul>
			<LoadingSkeleton elementType="li">List item</LoadingSkeleton>
		</ul>
	);
}
