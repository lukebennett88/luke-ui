import { Button } from '@luke-ui/react/button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Button, high prominence">
				<Button prominence="high" tone="accent">
					Continue
				</Button>
			</ComparisonItem>
			<ComparisonItem label="Button, standard prominence">
				<Button tone="accent">Save changes</Button>
			</ComparisonItem>
			<ComparisonItem label="Button, low prominence">
				<Button prominence="low" tone="accent">
					Save changes
				</Button>
			</ComparisonItem>
			<ComparisonItem label="Text">
				<Button appearance="text" tone="accent">
					Save changes
				</Button>
			</ComparisonItem>
		</Comparison>
	);
};
