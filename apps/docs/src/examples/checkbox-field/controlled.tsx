import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Stack } from '@luke-ui/react/stack';
import { useState } from 'react';

export default () => {
	const [isSelected, setIsSelected] = useState(false);

	return (
		<Stack maxInlineSize="20rem">
			<CheckboxField
				isSelected={isSelected}
				label={isSelected ? 'Checked' : 'Unchecked'}
				onChange={setIsSelected}
			/>
		</Stack>
	);
};
