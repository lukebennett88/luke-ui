import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [alignment, setAlignment] = useState('left');

	return (
		<Stack gap="space.16">
			<RadioGroup label="Text alignment" onChange={setAlignment} value={alignment}>
				<RadioField label="Left" value="left" />
				<RadioField label="Centre" value="centre" />
				<RadioField label="Right" value="right" />
			</RadioGroup>
			<Text color="secondary" elementType="p" role="status">
				{`Selected alignment: ${alignment}`}
			</Text>
		</Stack>
	);
};
