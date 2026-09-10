import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<Button size="small">Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<Button size="medium">Save changes</Button>
			</ComparisonItem>
		</Comparison>
	);
};
