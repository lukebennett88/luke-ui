import { Box } from '@luke-ui/react/box';
import { TextField } from '@luke-ui/react/text-field';

export default function Sizes() {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<Box maxInlineSize="12rem">
				<TextField label="Compact search" name="compactSearch" placeholder="Search" size="small" />
			</Box>
			<Box maxInlineSize="18rem">
				<TextField
					label="Search documentation"
					name="documentationSearch"
					placeholder="Search components"
					size="medium"
				/>
			</Box>
		</Box>
	);
}
