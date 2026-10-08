import { SwitchField } from '@luke-ui/react/switch-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Off">
				<SwitchField label="Example switch" />
			</ComparisonItem>
			<ComparisonItem label="On">
				<SwitchField defaultSelected label="Example switch" />
			</ComparisonItem>
			<ComparisonItem label="Disabled">
				<SwitchField isDisabled label="Example switch" />
			</ComparisonItem>
			<ComparisonItem label="Disabled and on">
				<SwitchField defaultSelected isDisabled label="Example switch" />
			</ComparisonItem>
			<ComparisonItem label="Invalid">
				<SwitchField
					errorMessage="Turn on this example switch to continue."
					label="Example switch"
				/>
			</ComparisonItem>
		</Comparison>
	);
};
