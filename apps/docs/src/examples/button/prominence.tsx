import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="High">
				<Button prominence="high">Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<Button>Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="Low">
				<Button prominence="low">Save changes</Button>
			</ComparisonItem>
		</Comparison>
	);
};
