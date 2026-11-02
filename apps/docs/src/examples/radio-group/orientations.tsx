import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<Stack>
			<RadioGroup label="Vertical options">
				<RadioField label="First" value="first" />
				<RadioField label="Second" value="second" />
			</RadioGroup>
			<RadioGroup label="Horizontal options" orientation="horizontal">
				<RadioField label="First" value="first" />
				<RadioField label="Second" value="second" />
			</RadioGroup>
		</Stack>
	);
};
