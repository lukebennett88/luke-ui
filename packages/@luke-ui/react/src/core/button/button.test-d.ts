import { expectTypeOf, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

test('Button accepts only supported appearance, tone, and prominence combinations', () => {
	const buttonControl: ButtonProps = { tone: 'critical', prominence: 'high' };
	const buttonText: ButtonProps = { appearance: 'text', prominence: 'high' };
	expectTypeOf<typeof buttonControl>().toExtend<ButtonProps>();

	// @ts-expect-error — text Buttons wrap and do not use control sizing
	const textButtonSize: ButtonProps = { appearance: 'text', size: 'small' };
	const neutralHighButton: ButtonProps = { prominence: 'high' };
	// @ts-expect-error — accent is not a consumer-selectable tone
	const accentLowButton: ButtonProps = { tone: 'accent', prominence: 'low' };
	// @ts-expect-error — critical text Buttons do not have high prominence
	const criticalHighText: ButtonProps = {
		appearance: 'text',
		tone: 'critical',
		prominence: 'high',
	};

	void buttonControl;
	void buttonText;
	void textButtonSize;
	void accentLowButton;
	void neutralHighButton;
	void criticalHighText;
});
