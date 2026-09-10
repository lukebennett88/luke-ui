import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="High">
				<Button tone="accent" prominence="high">
					Save changes
				</Button>
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<Button tone="accent">Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="Low">
				<Button tone="accent" prominence="low">
					Save changes
				</Button>
			</ComparisonItem>
		</Comparison>
	);
};
