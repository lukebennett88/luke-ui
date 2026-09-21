import { assertType, test } from 'vite-plus/test';
import type { IconLinkProps } from './icon-link.js';

test('IconLink supports ref and rejects unsupported props', () => {
	assertType<IconLinkProps>({ 'aria-label': 'Add', href: '/settings', icon: 'add', ref: null });
	assertType<IconLinkProps>({
		'aria-label': 'Delete',
		href: '/settings',
		icon: 'delete',
		// @ts-expect-error — IconLink has no tone prop
		tone: 'critical',
	});
	assertType<IconLinkProps>({
		// @ts-expect-error — IconLink has no appearance prop
		appearance: 'text',
		'aria-label': 'Add',
		href: '/settings',
		icon: 'add',
	});
	assertType<IconLinkProps>({
		// @ts-expect-error — IconLink has no appearance prop
		appearance: 'button',
		'aria-label': 'Add',
		href: '/settings',
		icon: 'add',
	});
	assertType<IconLinkProps>({
		'aria-label': 'Add',
		// @ts-expect-error — IconLink has no children prop
		children: 'Add',
		href: '/settings',
		icon: 'add',
	});
	// @ts-expect-error — IconLink always requires a navigation destination
	assertType<IconLinkProps>({ 'aria-label': 'Add', icon: 'add' });
	// @ts-expect-error — an icon-only link requires an accessible name
	assertType<IconLinkProps>({ href: '/settings', icon: 'add' });
	assertType<IconLinkProps>({
		'aria-label': 'Add',
		href: '/settings',
		icon: 'add',
		// @ts-expect-error — IconLink has no pending state
		isPending: true,
	});
	assertType<IconLinkProps>({
		'aria-label': 'Add',
		href: '/settings',
		icon: 'add',
		// @ts-expect-error — IconLink has no pressAction prop
		pressAction: async () => {},
	});
});
