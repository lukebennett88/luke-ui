import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Text">
				<Text elementType="p">
					Read the <Link href="#example-destination">documentation</Link>.
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Button">
				<Link appearance="button" tone="accent" prominence="high" href="#example-destination">
					View documentation
				</Link>
			</ComparisonItem>
		</Comparison>
	);
};
