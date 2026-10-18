import type { ButtonProps } from '@luke-ui/react/primitives/button';
import { createElement } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

test('primitive Button retains React Aria render', () => {
	expectTypeOf<ButtonProps['render']>().toEqualTypeOf<RacButtonProps['render']>();
	assertType<ButtonProps>({ render: (props, _state) => createElement('button', props) });
	// @ts-expect-error — the primitive retains React Aria render rather than renderRoot
	assertType<ButtonProps>({ renderRoot: () => null });
});

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
