import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Button">
				<Button>Button</Button>
			</ComparisonItem>
			<ComparisonItem label="Text">
				<Button appearance="text">Button</Button>
			</ComparisonItem>
		</Comparison>
	);
};
