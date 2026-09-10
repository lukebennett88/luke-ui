import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Box display="grid" gap="sp24">
			<Box display="grid" gap="sp8">
				<Text typography="label">Text</Text>
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
						<Link href="#example-destination" prominence="high">
							Example destination
						</Link>
					</ComparisonItem>
				</Comparison>
			</Box>
			<Box display="grid" gap="sp8">
				<Text typography="label">Button</Text>
				<Comparison>
					<ComparisonItem label="Low">
						<Link appearance="button" href="#example-destination" prominence="low">
							Example destination
						</Link>
					</ComparisonItem>
					<ComparisonItem label="Standard">
						<Link appearance="button" href="#example-destination">
							Example destination
						</Link>
					</ComparisonItem>
					<ComparisonItem label="High">
						<Link appearance="button" href="#example-destination" prominence="high">
							Example destination
						</Link>
					</ComparisonItem>
				</Comparison>
			</Box>
		</Box>
	);
};
