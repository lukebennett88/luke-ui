import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { TextField } from '@luke-ui/react/text-field';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
			<TextField
				label="Search documentation"
				name="documentationSearch"
				placeholder="Search components"
				prefix={<Icon name="search" size="small" />}
			/>
			<TextField label="Website" name="website" placeholder="example.com" prefix="https://" />
			<TextField label="Budget" name="budget" placeholder="0.00" suffix="AUD" />
		</Stack>
	);
};
