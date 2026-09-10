import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Button">
				<Button>Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="Text">
				<Button appearance="text">Save changes</Button>
			</ComparisonItem>
		</Comparison>
	);
};
