import { Checkbox } from '@luke-ui/react/checkbox';
import { useState } from 'react';

export default () => {
	const [isSelected, setIsSelected] = useState(false);

	return (
		<Checkbox isSelected={isSelected} onChange={setIsSelected}>
			Weekly summary
		</Checkbox>
	);
};
