import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Solid">
				<Button appearance="solid">Example button</Button>
			</ComparisonItem>
			<ComparisonItem label="Subtle">
				<Button appearance="subtle">Example button</Button>
			</ComparisonItem>
			<ComparisonItem label="Ghost">
				<Button appearance="ghost">Example button</Button>
			</ComparisonItem>
		</Comparison>
	);
};
