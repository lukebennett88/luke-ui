import type { ReactElement } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { IconName } from '../icon/icon.js';
import type { IconButtonProps } from './icon-button.js';

test('IconButton keeps icon a closed union of a registered name or an element', () => {
	expectTypeOf<IconButtonProps['icon']>().toEqualTypeOf<IconName | ReactElement>();
});

test('IconButton supports ref and rejects unsupported props', () => {
	assertType<IconButtonProps>({ 'aria-label': 'Add', icon: 'add', ref: null });
	assertType<IconButtonProps>({
		// @ts-expect-error — IconButton has no appearance prop
		appearance: 'text',
		'aria-label': 'Add',
		icon: 'add',
	});
	assertType<IconButtonProps>({
		// @ts-expect-error — IconButton has no appearance prop
		appearance: 'button',
		'aria-label': 'Add',
		icon: 'add',
	});
	// @ts-expect-error — accent is not a consumer-selectable tone
	assertType<IconButtonProps>({ 'aria-label': 'Add', icon: 'add', tone: 'accent' });
	// @ts-expect-error — an icon-only button requires an accessible name
	assertType<IconButtonProps>({ icon: 'add' });
	assertType<IconButtonProps>({
		'aria-label': 'Add',
		// @ts-expect-error — IconButton has no children prop
		children: 'Add',
		icon: 'add',
	});
});
