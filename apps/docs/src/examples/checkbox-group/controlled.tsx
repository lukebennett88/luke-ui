import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [days, setDays] = useState(['monday']);

	return (
		<Stack gap="space.16">
			<CheckboxGroup label="Days available" onChange={setDays} value={days}>
				<CheckboxField label="Monday" value="monday" />
				<CheckboxField label="Tuesday" value="tuesday" />
				<CheckboxField label="Wednesday" value="wednesday" />
			</CheckboxGroup>
			<Text color="secondary" elementType="p" role="status">
				{`Days selected: ${days.length}`}
			</Text>
		</Stack>
	);
};
