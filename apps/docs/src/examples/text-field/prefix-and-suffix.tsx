import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';

export default function PrefixAndSuffix() {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<TextField
				label="Search documentation"
				name="documentationSearch"
				placeholder="Search components"
				prefix={<Icon aria-hidden name="search" size="small" />}
			/>
			<TextField label="Website" name="website" placeholder="example.com" prefix="https://" />
			<TextField label="Budget" name="budget" placeholder="0.00" suffix="AUD" />
		</Box>
	);
}
