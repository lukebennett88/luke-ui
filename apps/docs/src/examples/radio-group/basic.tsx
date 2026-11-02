import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';

export default () => {
	return (
		<RadioGroup label="Choose a size" name="size">
			<RadioField label="Small" value="small" />
			<RadioField label="Medium" value="medium" />
			<RadioField label="Large" value="large" />
		</RadioGroup>
	);
};
