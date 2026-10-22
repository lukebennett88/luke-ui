import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Low">
				<Text>
					Open the{' '}
					<Link href="#example-destination" prominence="low">
						example destination
					</Link>
					.
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<Text>
					Open the <Link href="#example-destination">example destination</Link>.
				</Text>
			</ComparisonItem>
			<ComparisonItem label="High">
				<Text>
					Open the{' '}
					<Link href="#example-destination" prominence="high">
						example destination
					</Link>
					.
				</Text>
			</ComparisonItem>
		</Comparison>
	);
};
