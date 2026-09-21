/**
 * Compile-time guards on the public IconLink prop contract.
 *
 * IconLink is the narrowest of the action components: it navigates, it is icon-only, and it carries
 * no tone or pending state. Every one of those is a rejection that `check:types` cannot prove on its
 * own.
 */

import { expect, test } from 'vite-plus/test';
import type { IconLinkProps } from './icon-link.js';

const criticalIconLink: IconLinkProps = {
	'aria-label': 'Delete',
	href: '/settings',
	icon: 'delete',
	// @ts-expect-error — IconLink prominence describes navigation hierarchy without a tone
	tone: 'critical',
};
const textIconLink: IconLinkProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconLink has no public text appearance
	appearance: 'text',
	href: '/settings',
	icon: 'add',
};
const buttonAppearanceIconLink: IconLinkProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconLink is always button-shaped and does not accept `appearance`
	appearance: 'button',
	href: '/settings',
	icon: 'add',
};
const childrenIconLink: IconLinkProps = {
	'aria-label': 'Add',
	// @ts-expect-error — IconLink renders its icon and does not accept children
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
	// @ts-expect-error — IconLink has no Action-owned pressAction
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
