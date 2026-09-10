import type { ReactElement } from 'react';
import { expectTypeOf, test } from 'vite-plus/test';
import type { IconName } from '../icon/icon.js';
import type { IconButtonProps } from './icon-button.js';

test('IconButton accepts only supported button treatments', () => {
	const iconButton: IconButtonProps = {
		'aria-label': 'Add',
		icon: 'add',
		tone: 'neutral',
		prominence: 'low',
	};
	const criticalIconButton: IconButtonProps = {
		'aria-label': 'Delete',
		icon: 'delete',
		tone: 'critical',
		prominence: 'high',
	};
	expectTypeOf<typeof iconButton>().toExtend<IconButtonProps>();
	expectTypeOf<IconButtonProps['icon']>().toEqualTypeOf<IconName | ReactElement>();

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
	const neutralHighIconButton: IconButtonProps = {
		'aria-label': 'Add',
		icon: 'add',
		prominence: 'high',
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

	void iconButton;
	void criticalIconButton;
	void textIconButton;
	void buttonAppearanceIconButton;
	void neutralHighIconButton;
	void accentIconButton;
	void unlabelledIconButton;
	void childrenIconButton;
});
