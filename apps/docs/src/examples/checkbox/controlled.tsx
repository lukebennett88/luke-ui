import { Checkbox } from '@luke-ui/react/checkbox';
import { Stack } from '@luke-ui/react/stack';
import { useState } from 'react';

export default () => {
	const [isSelected, setIsSelected] = useState(false);

	return (
		<Stack maxInlineSize="20rem">
			<Checkbox
				isSelected={isSelected}
				label={isSelected ? 'Checked' : 'Unchecked'}
				onChange={setIsSelected}
			/>
		</Stack>
	);
};
