import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral">
				<Button tone="neutral">Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="Critical">
				<Button tone="critical">Delete draft</Button>
			</ComparisonItem>
		</Comparison>
	);
};
