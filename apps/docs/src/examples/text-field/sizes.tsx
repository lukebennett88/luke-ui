import { TextField } from '@luke-ui/react/text-field';

export default function Sizes() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<TextField label="Small" name="small" placeholder="Small input" size="small" />
			<TextField label="Medium" name="medium" placeholder="Medium input" size="medium" />
		</div>
	);
}
