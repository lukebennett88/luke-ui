import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral">
				<Button tone="neutral">Example button</Button>
			</ComparisonItem>
			<ComparisonItem label="Accent">
				<Button tone="accent">Example button</Button>
			</ComparisonItem>
			<ComparisonItem label="Danger">
				<Button tone="danger">Example button</Button>
			</ComparisonItem>
		</Comparison>
	);
};
