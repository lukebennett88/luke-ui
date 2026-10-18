import { SwitchField } from '@luke-ui/react/switch-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="small">
				<SwitchField defaultSelected label="Example switch" size="small" />
			</ComparisonItem>
			<ComparisonItem label="medium">
				<SwitchField defaultSelected label="Example switch" size="medium" />
			</ComparisonItem>
		</Comparison>
	);
};
