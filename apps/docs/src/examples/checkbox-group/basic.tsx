import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';

export default () => {
	return (
		<CheckboxGroup description="Choose any days that apply." label="Days available">
			<CheckboxField label="Monday" value="monday" />
			<CheckboxField label="Tuesday" value="tuesday" />
			<CheckboxField label="Wednesday" value="wednesday" />
		</CheckboxGroup>
	);
};
