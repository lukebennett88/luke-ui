import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

const sizes = [
	{ id: 'small', label: 'Small' },
	{ id: 'default', label: 'Default' },
	{ id: 'large', label: 'Large' },
];

export default () => {
	const [size, setSize] = useState<string | null>('default');

	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<SelectField items={sizes} label="Text size" onChange={setSize} value={size}>
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>
			<Text color="secondary" elementType="p" role="status">
				{`Selected key: ${size ?? 'none'}`}
			</Text>
		</Stack>
	);
};
