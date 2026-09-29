import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Stack gap="sp24">
			<Stack gap="sp8">
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
			</Stack>
			<Stack gap="sp8">
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
			</Stack>
		</Stack>
	);
};
