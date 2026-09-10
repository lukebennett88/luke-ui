import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral · Low">
				<Button prominence="low">Button</Button>
			</ComparisonItem>
			<ComparisonItem label="Neutral · Standard">
				<Button>Button</Button>
			</ComparisonItem>
			<ComparisonItem label="Neutral · High">
				<Button prominence="high">Button</Button>
			</ComparisonItem>
			<ComparisonItem label="Critical · Low">
				<Button tone="critical" prominence="low">
					Button
				</Button>
			</ComparisonItem>
			<ComparisonItem label="Critical · Standard">
				<Button tone="critical">Button</Button>
			</ComparisonItem>
			<ComparisonItem label="Critical · High">
				<Button tone="critical" prominence="high">
					Button
				</Button>
			</ComparisonItem>
		</Comparison>
	);
};
