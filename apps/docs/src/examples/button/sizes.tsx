import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="small">
				<Button size="small">Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="medium">
				<Button size="medium">Save changes</Button>
			</ComparisonItem>
		</Comparison>
	);
};
