import type { ButtonProps } from '@luke-ui/react/primitives/button';
import { createElement } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

test('primitive Button exposes renderRoot instead of React Aria render', () => {
	expectTypeOf<ButtonProps['renderRoot']>().toEqualTypeOf<RacButtonProps['render']>();
	assertType<ButtonProps>({ renderRoot: (domProps, _state) => createElement('button', domProps) });
	// @ts-expect-error — public root replacement is renderRoot, not React Aria render
	assertType<ButtonProps>({ render: (domProps, _state) => createElement('button', domProps) });
});

test('primitive Button supports ref and rejects unsupported prop combinations', () => {
	assertType<ButtonProps>({ ref: null });
	// @ts-expect-error — text Buttons do not use control sizing
	assertType<ButtonProps>({ appearance: 'text', size: 'small' });
	// @ts-expect-error — text Buttons do not use block layout
	assertType<ButtonProps>({ appearance: 'text', inlineSize: 'full' });
	// @ts-expect-error — critical text Buttons do not have high prominence
	assertType<ButtonProps>({
		appearance: 'text',
		prominence: 'high',
		tone: 'critical',
	});
});
