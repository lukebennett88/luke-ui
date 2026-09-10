import { Link } from '@luke-ui/react/link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Text · Low">
				<Link href="#example-destination" prominence="low">
					Example destination
				</Link>
			</ComparisonItem>
			<ComparisonItem label="Text · Standard">
				<Link href="#example-destination">Example destination</Link>
			</ComparisonItem>
			<ComparisonItem label="Text · High">
				<Link href="#example-destination" prominence="high">
					Example destination
				</Link>
			</ComparisonItem>
			<ComparisonItem label="Button · Low">
				<Link appearance="button" href="#example-destination" prominence="low">
					Example destination
				</Link>
			</ComparisonItem>
			<ComparisonItem label="Button · Standard">
				<Link appearance="button" href="#example-destination">
					Example destination
				</Link>
			</ComparisonItem>
			<ComparisonItem label="Button · High">
				<Link appearance="button" href="#example-destination" prominence="high">
					Example destination
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
