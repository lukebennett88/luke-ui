import { Link } from '@luke-ui/react/link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Text">
				<Link href="#example-destination">Example destination</Link>
			</ComparisonItem>
			<ComparisonItem label="Button">
				<Link appearance="button" href="#example-destination">
					Example destination
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
