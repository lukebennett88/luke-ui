import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { useState } from 'react';

export default () => {
	const [value, setValue] = useState(['first']);

	return (
		<CheckboxGroup label="Example options" onChange={setValue} value={value}>
			<CheckboxField label="First option" value="first" />
			<CheckboxField label="Second option" value="second" />
		</CheckboxGroup>
	);
};
