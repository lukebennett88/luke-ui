import { expectTypeOf, test } from 'vite-plus/test';
import type { ComboboxSize } from '../recipes/combobox.css.js';
import type { InputGroupSize } from '../recipes/input-group.css.js';
import type { FieldControlSize } from './control-size.js';

// Guards `ComboboxSize` and `InputGroupSize` against drifting from `FieldControlSize`,
// the union their icon-size maps are keyed by. Type assertions are compile-time only.
// oxlint-disable-next-line vitest/expect-expect
test('ComboboxSize and InputGroupSize stay exactly FieldControlSize', () => {
	expectTypeOf<ComboboxSize>().toEqualTypeOf<FieldControlSize>();
	expectTypeOf<InputGroupSize>().toEqualTypeOf<FieldControlSize>();
});
