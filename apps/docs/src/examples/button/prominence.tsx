import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="High">
				<Button prominence="high" tone="accent">
					Save changes
				</Button>
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<Button tone="accent">Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="Low">
				<Button prominence="low" tone="accent">
					Save changes
				</Button>
			</ComparisonItem>
		</Comparison>
	);
};
