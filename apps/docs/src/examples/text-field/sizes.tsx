import { TextField } from '@luke-ui/react/text-field';
import type { JSX } from 'react';

export default function Sizes(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<TextField name="small" label="Small" size="small" placeholder="Small input" />
			<TextField name="medium" label="Medium" size="medium" placeholder="Medium input" />
		</div>
	);
}
