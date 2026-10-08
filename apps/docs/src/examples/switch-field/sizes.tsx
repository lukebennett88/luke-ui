import { SwitchField } from '@luke-ui/react/switch-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<SwitchField defaultSelected label="Example switch" size="small" />
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<SwitchField defaultSelected label="Example switch" size="medium" />
			</ComparisonItem>
			<ComparisonItem label="Large">
				<SwitchField defaultSelected label="Example switch" size="large" />
			</ComparisonItem>
		</Comparison>
	);
};
