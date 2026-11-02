import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';

export default () => {
	return (
		<RadioGroup
			description="Choose one option to continue."
			errorMessage="Choose an option."
			isInvalid
			label="Choose a size"
		>
			<RadioField label="Small" value="small" />
			<RadioField label="Medium" value="medium" />
		</RadioGroup>
	);
};
