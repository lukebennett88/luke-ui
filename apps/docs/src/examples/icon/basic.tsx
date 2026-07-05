import { Icon } from '@luke-ui/react/icon';
import type { JSX } from 'react';

export const meta = {
	title: 'Icon — Basic',
	description: 'Standalone and decorative icons from the spritesheet.',
};

export default function Basic(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Icon name="add" title="Add" size="xsmall" />
			<Icon name="close" aria-hidden size="medium" />
		</div>
	);
}
