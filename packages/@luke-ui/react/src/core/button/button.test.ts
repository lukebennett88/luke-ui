import { createElement } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

test('Button supports ref and rejects unsupported prop combinations', () => {
	assertType<ButtonProps>({ ref: null });
	assertType<ButtonProps>({
		children: (renderProps) => (renderProps.isPressed ? 'Pressed' : 'Idle'),
	});
	// @ts-expect-error — high-level Button omits root replacement; use function children instead
	assertType<ButtonProps>({ renderRoot: (props) => createElement('button', props) });
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

test('Button accepts only automatic or full inline sizing for button appearances', () => {
	expectTypeOf<ButtonProps['inlineSize']>().toEqualTypeOf<'auto' | 'full' | undefined>();
	// @ts-expect-error — custom lengths belong in style
	assertType<ButtonProps>({ appearance: 'button', inlineSize: '20rem' });
	// @ts-expect-error — text appearances do not expose inline sizing
	assertType<ButtonProps>({ appearance: 'text', inlineSize: 'full' });
});
