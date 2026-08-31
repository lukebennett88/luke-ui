import { Link } from '@luke-ui/react/link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Accent">
				<Link href="#example-destination" tone="accent">
					Example destination
				</Link>
			</ComparisonItem>
			<ComparisonItem label="Neutral">
				<Link href="#example-destination" tone="neutral">
					Example destination
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
