import { expectTypeOf, test } from 'vite-plus/test';
import type { IconButtonProps } from './icon-button.js';

test('IconButton accepts only supported button treatments', () => {
	const iconButton: IconButtonProps = { icon: 'add', tone: 'accent', prominence: 'low' };
	const criticalIconButton: IconButtonProps = {
		icon: 'delete',
		tone: 'critical',
		prominence: 'high',
	};
	expectTypeOf<typeof iconButton>().toExtend<IconButtonProps>();

	// @ts-expect-error — IconButton keeps button presentation
	const textIconButton: IconButtonProps = { appearance: 'text', icon: 'add' };
	// @ts-expect-error — neutral high is not a supported IconButton treatment
	const neutralHighIconButton: IconButtonProps = { icon: 'add', prominence: 'high' };

	void iconButton;
	void criticalIconButton;
	void textIconButton;
	void neutralHighIconButton;
});
