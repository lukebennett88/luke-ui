import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<Button size="small">Example button</Button>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<Button size="medium">Example button</Button>
			</ComparisonItem>
		</Comparison>
	);
};
