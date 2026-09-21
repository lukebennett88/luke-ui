import { assertType, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

test('Button supports ref and rejects unsupported prop combinations', () => {
	assertType<ButtonProps>({ ref: null });
	// @ts-expect-error — text Buttons wrap and do not use control sizing
	assertType<ButtonProps>({ appearance: 'text', size: 'small' });
	// @ts-expect-error — accent is not a consumer-selectable tone
	assertType<ButtonProps>({ prominence: 'low', tone: 'accent' });
	// @ts-expect-error — critical text Buttons do not have high prominence
	assertType<ButtonProps>({
		appearance: 'text',
		prominence: 'high',
		tone: 'critical',
	});
});
