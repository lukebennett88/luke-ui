import { SwitchField } from '@luke-ui/react/switch-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="px16">
				<SwitchField defaultSelected label="Example switch" size="px16" />
			</ComparisonItem>
			<ComparisonItem label="px20">
				<SwitchField defaultSelected label="Example switch" size="px20" />
			</ComparisonItem>
		</Comparison>
	);
};
