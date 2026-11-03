import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';

export default () => {
	return (
		<RadioGroup label="Text alignment" name="alignment">
			<RadioField label="Left" value="left" />
			<RadioField label="Centre" value="centre" />
			<RadioField label="Right" value="right" />
		</RadioGroup>
	);
};
