import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';

export default () => {
	return (
		<ul>
			<LoadingSkeleton elementType="li">List item</LoadingSkeleton>
		</ul>
	);
};
