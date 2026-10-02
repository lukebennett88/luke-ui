import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { TextInputField } from '@luke-ui/react/text-input-field';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<TextInputField
				label="Search documentation"
				name="documentationSearch"
				placeholder="Search components"
				prefix={<Icon name="search" size="small" />}
			/>
			<TextInputField label="Website" name="website" placeholder="example.com" prefix="https://" />
			<TextInputField label="Budget" name="budget" placeholder="0.00" suffix="AUD" />
		</Stack>
	);
};
