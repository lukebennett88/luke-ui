import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { LinkProps } from './link.js';

test('Link supports ref and rejects unsupported props', () => {
	assertType<LinkProps>({ href: '/settings', ref: null });
	// @ts-expect-error — Link always requires a navigation destination
	assertType<LinkProps>({});
	// @ts-expect-error — text Links do not use button content slots
	assertType<LinkProps>({ endContent: 'next', href: '/settings' });
	// @ts-expect-error — Link has no tone prop
	assertType<LinkProps>({ href: '/settings', tone: 'danger' });
	// @ts-expect-error — text Links do not use control sizing
	assertType<LinkProps>({ href: '/settings', size: 'small' });
});

test('Link accepts only automatic or full inline sizing for button appearances', () => {
	expectTypeOf<LinkProps['inlineSize']>().toEqualTypeOf<'auto' | 'full' | undefined>();
	// @ts-expect-error — custom lengths belong in style
	assertType<LinkProps>({ appearance: 'button', inlineSize: '20rem', href: '#' });
	// @ts-expect-error — text appearances do not expose inline sizing
	assertType<LinkProps>({ appearance: 'text', inlineSize: 'full', href: '#' });
});

test('Link keeps high prominence for button appearances only', () => {
	assertType<LinkProps>({ appearance: 'button', href: '#', prominence: 'high' });
	assertType<LinkProps>({ href: '#', prominence: 'low' });
	// @ts-expect-error — text Links have low and standard prominence only
	assertType<LinkProps>({ href: '#', prominence: 'high' });
	// @ts-expect-error — text Links have low and standard prominence only
	assertType<LinkProps>({ appearance: 'text', href: '#', prominence: 'high' });
});
