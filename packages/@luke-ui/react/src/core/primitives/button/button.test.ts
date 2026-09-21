import { assertType, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

test('primitive Button supports ref and rejects unsupported prop combinations', () => {
	assertType<ButtonProps>({ ref: null });
	// @ts-expect-error — text Buttons do not use control sizing
	assertType<ButtonProps>({ appearance: 'text', size: 'small' });
	// @ts-expect-error — text Buttons do not use block layout
	assertType<ButtonProps>({ appearance: 'text', isBlock: true });
	// @ts-expect-error — critical text Buttons do not have high prominence
	assertType<ButtonProps>({
		appearance: 'text',
		prominence: 'high',
		tone: 'critical',
	});
});
