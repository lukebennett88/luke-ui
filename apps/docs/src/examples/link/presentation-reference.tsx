import { Cluster } from '@luke-ui/react/cluster';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Low">
				<Cluster gap="space.24">
					<Text>
						Open the{' '}
						<Link href="#example-destination" prominence="low">
							example destination
						</Link>
						.
					</Text>
					<Link appearance="button" href="#example-destination" prominence="low">
						Example destination
					</Link>
				</Cluster>
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<Cluster gap="space.24">
					<Text>
						Open the <Link href="#example-destination">example destination</Link>.
					</Text>
					<Link appearance="button" href="#example-destination">
						Example destination
					</Link>
				</Cluster>
			</ComparisonItem>
			<ComparisonItem label="High">
				<Cluster gap="space.24">
					<Text>
						Open the{' '}
						<Link href="#example-destination" prominence="high">
							example destination
						</Link>
						.
					</Text>
					<Link appearance="button" href="#example-destination" prominence="high">
						Example destination
					</Link>
				</Cluster>
			</ComparisonItem>
		</Comparison>
	);
};
