import type { TextProps } from '@luke-ui/react/text';
import { assertType, test } from 'vite-plus/test';

test('Text accepts named slots and null slot opt-out', () => {
	assertType<TextProps>({ slot: 'description' });
	assertType<TextProps>({ slot: null });
	assertType<TextProps>({ isVisuallyHidden: true, slot: null });
	assertType<TextProps>({ isVisuallyHidden: true, slot: 'label' });
});
