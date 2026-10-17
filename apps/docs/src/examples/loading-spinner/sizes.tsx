import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison align="center">
			<ComparisonItem label="px16">
				<LoadingSpinner aria-label="Loading" size="px16" />
			</ComparisonItem>
			<ComparisonItem label="px20">
				<LoadingSpinner aria-label="Loading" size="px20" />
			</ComparisonItem>
			<ComparisonItem label="px24">
				<LoadingSpinner aria-label="Loading" size="px24" />
			</ComparisonItem>
			<ComparisonItem label="px32">
				<LoadingSpinner aria-label="Loading" size="px32" />
			</ComparisonItem>
		</Comparison>
	);
};
