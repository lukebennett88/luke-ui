import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { useState } from 'react';

export default () => {
	const [isSelected, setIsSelected] = useState(false);

	return (
		<CheckboxField
			isSelected={isSelected}
			label={isSelected ? 'Checked' : 'Unchecked'}
			onChange={setIsSelected}
		/>
	);
};
