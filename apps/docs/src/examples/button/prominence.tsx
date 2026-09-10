import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral · Low">
				<Button appearance="text" prominence="low">
					Button
				</Button>
			</ComparisonItem>
			<ComparisonItem label="Neutral · Standard">
				<Button appearance="text">Button</Button>
			</ComparisonItem>
			<ComparisonItem label="Neutral · High">
				<Button appearance="text" prominence="high">
					Button
				</Button>
			</ComparisonItem>
			<ComparisonItem label="Critical · Low">
				<Button appearance="text" tone="critical" prominence="low">
					Button
				</Button>
			</ComparisonItem>
			<ComparisonItem label="Critical · Standard">
				<Button appearance="text" tone="critical">
					Button
				</Button>
			</ComparisonItem>
		</Comparison>
	);
};
