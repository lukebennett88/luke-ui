import { TextField } from '@luke-ui/react/text-field';
import type { JSX } from 'react';

export default function Required(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<TextField isRequired name="firstName" label="First name" necessityIndicator="icon" />
			<TextField isRequired name="lastName" label="Last name" necessityIndicator="label" />
		</div>
	);
}
