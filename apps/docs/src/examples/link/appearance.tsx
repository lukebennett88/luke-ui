import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Text">
				<Text>
					Open the <Link href="#example-destination">example destination</Link>.
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Button">
				<Link appearance="button" href="#example-destination">
					Example destination
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
