import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison align="center">
			<ComparisonItem label="xsmall">
				<LoadingSpinner aria-label="Loading" size="xsmall" />
			</ComparisonItem>
			<ComparisonItem label="small">
				<LoadingSpinner aria-label="Loading" size="small" />
			</ComparisonItem>
			<ComparisonItem label="medium">
				<LoadingSpinner aria-label="Loading" size="medium" />
			</ComparisonItem>
			<ComparisonItem label="large">
				<LoadingSpinner aria-label="Loading" size="large" />
			</ComparisonItem>
		</Comparison>
	);
};
