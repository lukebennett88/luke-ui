import { Icon } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';

export default function Adornments() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<TextField
				adornmentStart={<Icon aria-hidden name="search" size="small" />}
				label="Search"
				name="search"
			/>
			<TextField adornmentStart="https://" label="URL" name="url" />
			<TextField adornmentEnd="AUD" label="Price" name="price" />
		</div>
	);
}
