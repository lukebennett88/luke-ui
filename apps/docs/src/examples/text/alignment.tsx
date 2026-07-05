import { Text } from '@luke-ui/react/text';
import type { JSX } from 'react';

export const meta = {
	title: 'Text — Alignment and numeric glyphs',
	description: 'Align text and set numeric glyph styles such as tabular numerals.',
};

export default function Alignment(): JSX.Element {
	return (
		<Text textAlign="end" fontVariantNumeric="tabular-nums" style={{ display: 'block' }}>
			12121.21
		</Text>
	);
}
