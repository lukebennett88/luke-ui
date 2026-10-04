import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { GridProps } from './grid.js';

test('Grid accepts its alignment props and rejects the props it does not support', () => {
	// @ts-expect-error — responsive columns require an initial value
	assertType<GridProps>({ columns: { bp768: 3 } });
	// @ts-expect-error — responsive areas require an initial value
	assertType<GridProps>({ areas: { bp768: ['a b'] } });
	// @ts-expect-error — Grid does not expose Box appearance utilities
	assertType<GridProps>({ backgroundColor: 'surface.canvas', columns: 2 });
	// @ts-expect-error — Grid has no display prop
	assertType<GridProps>({ columns: 2, display: 'flex' });
	// @ts-expect-error — flex-end is omitted on a grid container
	assertType<GridProps>({ alignItems: 'flex-end', columns: 2 });
	// @ts-expect-error — flex-start is omitted on a grid container
	assertType<GridProps>({ alignContent: 'flex-start', columns: 2 });
	// @ts-expect-error — flex-end is omitted on a grid container
	assertType<GridProps>({ columns: 2, justifyContent: 'flex-end' });
	// @ts-expect-error — flex-start is omitted from responsive values
	assertType<GridProps>({ alignItems: { initial: 'flex-start' }, columns: 2 });
	expectTypeOf<{
		alignContent: 'start';
		alignItems: 'end';
		justifyContent: 'space-between';
		justifyItems: 'center';
	}>().toExtend<GridProps>();
});
