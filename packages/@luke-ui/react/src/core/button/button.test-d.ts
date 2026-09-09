import { expectTypeOf, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

test('Button accepts only supported appearance, prominence, and tone combinations', () => {
	const buttonControl: ButtonProps = { prominence: 'high', tone: 'critical' };
	const buttonText: ButtonProps = { appearance: 'text', prominence: 'high', tone: 'accent' };
	expectTypeOf<typeof buttonControl>().toExtend<ButtonProps>();

	// @ts-expect-error — text Buttons wrap and do not use control sizing
	const textButtonSize: ButtonProps = { appearance: 'text', size: 'small' };
	const accentLowButton: ButtonProps = { prominence: 'low', tone: 'accent' };
	// @ts-expect-error — neutral high is not a supported Button treatment
	const neutralHighButton: ButtonProps = { prominence: 'high' };

	void buttonControl;
	void buttonText;
	void textButtonSize;
	void accentLowButton;
	void neutralHighButton;
});
