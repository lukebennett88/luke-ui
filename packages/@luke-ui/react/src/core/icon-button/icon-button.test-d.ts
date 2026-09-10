import { expectTypeOf, test } from 'vite-plus/test';
import type { ReactElement } from 'react';
import type { IconButtonProps } from './icon-button.js';

declare const customIcon: ReactElement;

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
	const customIconButton: IconButtonProps = {
		'aria-label': 'Brand',
		icon: customIcon,
	};
	expectTypeOf<typeof iconButton>().toExtend<IconButtonProps>();
	expectTypeOf<typeof customIconButton>().toExtend<IconButtonProps>();

	// @ts-expect-error — IconButton is always button-shaped and does not accept `appearance`
	const textIconButton: IconButtonProps = { 'aria-label': 'Add', appearance: 'text', icon: 'add' };
	// @ts-expect-error — IconButton is always button-shaped and does not accept `appearance`
	const buttonAppearanceIconButton: IconButtonProps = {
		'aria-label': 'Add',
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
	void customIconButton;
	void textIconButton;
	void buttonAppearanceIconButton;
	void neutralHighIconButton;
	void accentIconButton;
	void unlabelledIconButton;
	void childrenIconButton;
});
