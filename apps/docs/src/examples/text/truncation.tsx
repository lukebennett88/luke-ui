import { Text } from '@luke-ui/react/text';
import type { JSX } from 'react';

export const meta = {
	title: 'Text — Truncation',
	description: 'Clamp lines, truncate to one line, or disable cap-height trim.',
};

export default function Truncation(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<Text lineClamp={2}>Long content that should be line clamped to two lines.</Text>
			<Text lineClamp>Long content truncated to one line.</Text>
			<Text shouldDisableTrim>Untrimmed text spacing</Text>
		</div>
	);
}
