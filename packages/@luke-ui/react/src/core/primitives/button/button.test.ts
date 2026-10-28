import type { ButtonProps } from '@luke-ui/react/primitives/button';
import { assertType, test } from 'vite-plus/test';

test('primitive Button keeps a fixed button root', () => {
	assertType<ButtonProps>({ ref: null });
	// @ts-expect-error — interactive buttons do not expose root replacement
	assertType<ButtonProps>({ render: () => null });
	// @ts-expect-error — interactive buttons do not expose root replacement
	assertType<ButtonProps>({ renderRoot: () => null });
});

test('primitive Button supports ref and rejects unsupported prop combinations', () => {
	assertType<ButtonProps>({ ref: null });
	// @ts-expect-error — text Buttons do not use control sizing
	assertType<ButtonProps>({ appearance: 'text', size: 'small' });
	// @ts-expect-error — text Buttons do not use block layout
	assertType<ButtonProps>({ appearance: 'text', inlineSize: 'full' });
	// @ts-expect-error — danger text Buttons do not have high prominence
	assertType<ButtonProps>({
		appearance: 'text',
		prominence: 'high',
		tone: 'danger',
	});
});
