import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison direction="vertical">
			<ComparisonItem label="Text">
				<Text elementType="p">
					Read the <Link href="#example-destination">documentation</Link>.
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Button">
				<Link appearance="button" href="#example-destination" prominence="high" tone="accent">
					View documentation
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
