import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="X-small">
				<LoadingSpinner aria-label="Loading" size="xsmall" />
			</ComparisonItem>
			<ComparisonItem label="Small">
				<LoadingSpinner aria-label="Loading" size="small" />
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<LoadingSpinner aria-label="Loading" size="medium" />
			</ComparisonItem>
			<ComparisonItem label="Large">
				<LoadingSpinner aria-label="Loading" size="large" />
			</ComparisonItem>
		</Comparison>
	);
};
