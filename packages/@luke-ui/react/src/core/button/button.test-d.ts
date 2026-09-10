import { expectTypeOf, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

test('Button accepts only supported appearance, tone, and prominence combinations', () => {
	const buttonControl: ButtonProps = { tone: 'critical', prominence: 'high' };
	const buttonText: ButtonProps = { appearance: 'text', tone: 'accent', prominence: 'high' };
	expectTypeOf<typeof buttonControl>().toExtend<ButtonProps>();

	// @ts-expect-error — text Buttons wrap and do not use control sizing
	const textButtonSize: ButtonProps = { appearance: 'text', size: 'small' };
	const accentLowButton: ButtonProps = { tone: 'accent', prominence: 'low' };
	// @ts-expect-error — neutral high is not a supported Button treatment
	const neutralHighButton: ButtonProps = { prominence: 'high' };

	void buttonControl;
	void buttonText;
	void textButtonSize;
	void accentLowButton;
	void neutralHighButton;
});
