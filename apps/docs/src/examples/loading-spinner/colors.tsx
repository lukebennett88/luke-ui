import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Inherited">
				<LoadingSpinner aria-label="Loading" />
			</ComparisonItem>
			<ComparisonItem label="Primary">
				<LoadingSpinner aria-label="Loading" color="primary" />
			</ComparisonItem>
			<ComparisonItem label="Secondary">
				<LoadingSpinner aria-label="Loading" color="secondary" />
			</ComparisonItem>
			<ComparisonItem label="Accent">
				<LoadingSpinner aria-label="Loading" color="accent" />
			</ComparisonItem>
			<ComparisonItem label="Info">
				<LoadingSpinner aria-label="Loading" color="info" />
			</ComparisonItem>
			<ComparisonItem label="Success">
				<LoadingSpinner aria-label="Loading" color="success" />
			</ComparisonItem>
			<ComparisonItem label="Warning">
				<LoadingSpinner aria-label="Loading" color="warning" />
			</ComparisonItem>
			<ComparisonItem label="Danger">
				<LoadingSpinner aria-label="Loading" color="danger" />
			</ComparisonItem>
		</Comparison>
	);
};
