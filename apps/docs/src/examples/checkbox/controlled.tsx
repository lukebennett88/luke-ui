import { Checkbox } from '@luke-ui/react/checkbox';
import { useState } from 'react';

export default function Controlled() {
	const [isSelected, setIsSelected] = useState(false);

	return (
		<Checkbox isSelected={isSelected} onChange={setIsSelected}>
			Weekly summary
		</Checkbox>
	);
}
