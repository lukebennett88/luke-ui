/**
 * Compile-time guards on the public IconButton prop contract.
 *
 * Rejections plus the one exact type: `icon` is a closed union, and widening it would go unnoticed
 * by `check:types` alone.
 */

import type { ReactElement } from 'react';
import { expect, expectTypeOf, test } from 'vite-plus/test';
import type { IconName } from '../icon/icon.js';
import type { IconButtonProps } from './icon-button.js';

const textIconButton: IconButtonProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconButton is always button-shaped and does not accept `appearance`
	appearance: 'text',
	icon: 'add',
};
const buttonAppearanceIconButton: IconButtonProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconButton is always button-shaped and does not accept `appearance`
	appearance: 'button',
	icon: 'add',
};
// @ts-expect-error — accent is not a consumer-selectable tone
const accentIconButton: IconButtonProps = { 'aria-label': 'Add', icon: 'add', tone: 'accent' };
// @ts-expect-error — an icon-only button requires an accessible name
const unlabelledIconButton: IconButtonProps = { icon: 'add' };
const childrenIconButton: IconButtonProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconButton renders its icon and does not accept children
	children: 'Add',
	icon: 'add',
};

test('IconButton keeps icon a closed union of a registered name or an element', () => {
	expectTypeOf<IconButtonProps['icon']>().toEqualTypeOf<IconName | ReactElement>();
});

test('IconButton rejects the props it does not support', () => {
	expect([
		textIconButton,
		buttonAppearanceIconButton,
		accentIconButton,
		unlabelledIconButton,
		childrenIconButton,
	]).toHaveLength(5);
});
