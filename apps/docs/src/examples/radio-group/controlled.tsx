import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { useState } from 'react';

export default () => {
	const [value, setValue] = useState('medium');

	return (
		<RadioGroup label="Choose a size" onChange={setValue} value={value}>
			<RadioField label="Small" value="small" />
			<RadioField label="Medium" value="medium" />
			<RadioField label="Large" value="large" />
		</RadioGroup>
	);
};
