import type { BlockquoteProps } from '@luke-ui/react/blockquote';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

test('Blockquote keeps a fixed blockquote element and rejects root replacement', () => {
	assertType<BlockquoteProps>({ children: 'Quoted' });
	assertType<BlockquoteProps>({ children: 'Quoted', typography: 'lead' });
	expectTypeOf<BlockquoteProps>().not.toHaveProperty('elementType');
	expectTypeOf<BlockquoteProps['renderRoot']>().toEqualTypeOf<undefined>();
});
