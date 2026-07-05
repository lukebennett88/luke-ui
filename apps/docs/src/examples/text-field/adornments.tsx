import { Icon } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';
import type { JSX } from 'react';

export const meta = {
	title: 'Text Field — Adornments',
	description: 'Start and end adornments inside the input chrome.',
};

export default function Adornments(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<TextField
				name="search"
				label="Search"
				adornmentStart={<Icon name="search" aria-hidden size="small" />}
			/>
			<TextField name="url" label="URL" adornmentStart="https://" />
			<TextField name="price" label="Price" adornmentEnd="AUD" />
		</div>
	);
}
