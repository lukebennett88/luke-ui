import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="px32">
				<Button size="px32">Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="px40">
				<Button size="px40">Save changes</Button>
			</ComparisonItem>
		</Comparison>
	);
};
