import { Link } from '@luke-ui/react/link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Low neutral">
				<Link href="#example-destination" prominence="low">
					Documentation
				</Link>
			</ComparisonItem>
			<ComparisonItem label="High accent">
				<Link href="#example-destination" prominence="high" tone="accent">
					Upgrade plan
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
