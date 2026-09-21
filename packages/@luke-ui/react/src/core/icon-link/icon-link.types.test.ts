import { expect, test } from 'vite-plus/test';
import type { IconLinkProps } from './icon-link.js';

const criticalIconLink: IconLinkProps = {
	'aria-label': 'Delete',
	href: '/settings',
	icon: 'delete',
	// @ts-expect-error — IconLink has no tone prop
	tone: 'critical',
};
const textIconLink: IconLinkProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconLink has no appearance prop
	appearance: 'text',
	href: '/settings',
	icon: 'add',
};
const buttonAppearanceIconLink: IconLinkProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconLink has no appearance prop
	appearance: 'button',
	href: '/settings',
	icon: 'add',
};
const childrenIconLink: IconLinkProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconLink has no children prop
	children: 'Add',
	href: '/settings',
	icon: 'add',
};
// @ts-expect-error — IconLink always requires a navigation destination
const missingHref: IconLinkProps = { 'aria-label': 'Add', icon: 'add' };
// @ts-expect-error — an icon-only link requires an accessible name
const unlabelledIconLink: IconLinkProps = { href: '/settings', icon: 'add' };
const pendingIconLink: IconLinkProps = {
	'aria-label': 'Add',
	href: '/settings',
	icon: 'add',
	// @ts-expect-error — IconLink has no pending state
	isPending: true,
};
const pressActionIconLink: IconLinkProps = {
	'aria-label': 'Add',
	href: '/settings',
	icon: 'add',
	// @ts-expect-error — IconLink has no pressAction prop
	pressAction: async () => {},
};

test('IconLink rejects the props it does not support', () => {
	expect([
		criticalIconLink,
		textIconLink,
		buttonAppearanceIconLink,
		childrenIconLink,
		missingHref,
		unlabelledIconLink,
		pendingIconLink,
		pressActionIconLink,
	]).toHaveLength(8);
});
