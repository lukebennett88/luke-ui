import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<Stack>
			<RadioGroup label="Small group" size="small">
				<RadioField label="Small option" value="small" />
				<RadioField label="Medium option" size="medium" value="medium" />
			</RadioGroup>
			<RadioGroup label="Medium group">
				<RadioField label="Medium option" value="medium" />
			</RadioGroup>
		</Stack>
	);
};
