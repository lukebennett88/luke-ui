import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="18rem">
			<Text elementType="div" typography="caption">
				<CheckboxField label="A longer label keeps its control aligned when it wraps." />
			</Text>
			<Text elementType="div" typography="heading4">
				<CheckboxField label="Larger text keeps the same first-line alignment when it wraps." />
			</Text>
		</Stack>
	);
};
