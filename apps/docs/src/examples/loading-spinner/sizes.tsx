import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison align="center">
			<ComparisonItem label="size.16">
				<LoadingSpinner aria-label="Loading" size="size.16" />
			</ComparisonItem>
			<ComparisonItem label="size.20">
				<LoadingSpinner aria-label="Loading" size="size.20" />
			</ComparisonItem>
			<ComparisonItem label="size.24">
				<LoadingSpinner aria-label="Loading" size="size.24" />
			</ComparisonItem>
			<ComparisonItem label="size.32">
				<LoadingSpinner aria-label="Loading" size="size.32" />
			</ComparisonItem>
		</Comparison>
	);
};
