import { Emoji } from '@luke-ui/react/emoji';
import type { JSX } from 'react';

export const meta = {
	title: 'Emoji — Basic',
	description: 'Emoji with accessible label and typography controls.',
};

export default function Basic(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Emoji emoji="🎉" label="Celebration" />
			<Emoji emoji="🚀" label="Rocket" fontSize="large" />
		</div>
	);
}
