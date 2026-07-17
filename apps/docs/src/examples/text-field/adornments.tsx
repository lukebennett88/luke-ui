import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';

export default function Adornments() {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<TextField
				adornmentStart={<Icon aria-hidden name="search" size="small" />}
				label="Search documentation"
				name="documentationSearch"
				placeholder="Search components"
			/>
			<TextField
				adornmentStart="https://"
				label="Website"
				name="website"
				placeholder="example.com"
			/>
			<TextField adornmentEnd="AUD" label="Budget" name="budget" placeholder="0.00" />
		</Box>
	);
}
