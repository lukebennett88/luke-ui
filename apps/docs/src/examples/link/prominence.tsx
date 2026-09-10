import { Link } from '@luke-ui/react/link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Low neutral">
				<Link href="#example-destination" prominence="low">
					Example destination
				</Link>
			</ComparisonItem>
			<ComparisonItem label="Standard neutral">
				<Link href="#example-destination">Example destination</Link>
			</ComparisonItem>
			<ComparisonItem label="High accent">
				<Link href="#example-destination" prominence="high" tone="accent">
					Example destination
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
