import { expectTypeOf, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

test('primitive Button accepts only supported appearance, tone, and prominence combinations', () => {
	const buttonControl: ButtonProps = { tone: 'critical', prominence: 'high' };
	const buttonText: ButtonProps = { appearance: 'text', prominence: 'high' };
	expectTypeOf<typeof buttonControl>().toExtend<ButtonProps>();

	// @ts-expect-error — text Buttons do not use control sizing
	const textButtonSize: ButtonProps = { appearance: 'text', size: 'small' };
	// @ts-expect-error — text Buttons do not use block layout
	const textButtonBlock: ButtonProps = { appearance: 'text', isBlock: true };
	// @ts-expect-error — critical text Buttons do not have high prominence
	const criticalHighText: ButtonProps = {
		appearance: 'text',
		tone: 'critical',
		prominence: 'high',
	};

	void buttonControl;
	void buttonText;
	void textButtonSize;
	void textButtonBlock;
	void criticalHighText;
});
