import { expectTypeOf, test } from 'vite-plus/test';
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

	// @ts-expect-error — IconButton keeps button presentation
	const textIconButton: IconButtonProps = { 'aria-label': 'Add', appearance: 'text', icon: 'add' };
	const neutralHighIconButton: IconButtonProps = {
		'aria-label': 'Add',
		icon: 'add',
		prominence: 'high',
	};
	// @ts-expect-error — accent is not a consumer-selectable tone
	const accentIconButton: IconButtonProps = { 'aria-label': 'Add', icon: 'add', tone: 'accent' };
	// @ts-expect-error — an icon-only button requires an accessible name
	const unlabelledIconButton: IconButtonProps = { icon: 'add' };

	void iconButton;
	void criticalIconButton;
	void textIconButton;
	void neutralHighIconButton;
	void accentIconButton;
	void unlabelledIconButton;
});
