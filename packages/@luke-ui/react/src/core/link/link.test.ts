import { assertType, test } from 'vite-plus/test';
import type { LinkProps } from './link.js';

test('Link supports ref and rejects unsupported props', () => {
	assertType<LinkProps>({ href: '/settings', ref: null });
	// @ts-expect-error — Link always requires a navigation destination
	assertType<LinkProps>({});
	// @ts-expect-error — text Links do not use button content slots
	assertType<LinkProps>({ endContent: 'next', href: '/settings' });
	// @ts-expect-error — Link has no tone prop
	assertType<LinkProps>({ href: '/settings', tone: 'critical' });
	// @ts-expect-error — text Links do not use control sizing
	assertType<LinkProps>({ href: '/settings', size: 'small' });
});
