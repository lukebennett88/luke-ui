import { createElement } from 'react';
import type { ComponentProps } from 'react';
import { assertType, test } from 'vite-plus/test';
import type { CellText } from './reference-table.js';

type CellTextProps = ComponentProps<typeof CellText>;

test('CellText allows elementType for block description content without renderRoot', () => {
	assertType<CellTextProps>({ color: 'secondary' });
	assertType<CellTextProps>({ elementType: 'div', children: createElement('ul') });
	// @ts-expect-error — table cell text does not expose caller-owned roots
	assertType<CellTextProps>({ renderRoot: () => null });
});
