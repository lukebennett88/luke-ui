import { Link } from '@luke-ui/react/link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Low">
				<Link href="#example-destination" prominence="low">
					Example destination
				</Link>
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<Link href="#example-destination">Example destination</Link>
			</ComparisonItem>
			<ComparisonItem label="High">
				<Link prominence="high" href="#example-destination">
					Example destination
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
