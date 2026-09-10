import { expectTypeOf, test } from 'vite-plus/test';
import type { IconLinkProps } from './icon-link.js';

test('IconLink accepts only supported treatments and requires navigation and naming props', () => {
	const iconLink: IconLinkProps = {
		'aria-label': 'Settings',
		href: '/settings',
		icon: 'add',
		tone: 'accent',
		prominence: 'low',
	};
	const criticalIconLink: IconLinkProps = {
		'aria-label': 'Delete',
		href: '/settings',
		icon: 'delete',
		tone: 'critical',
		prominence: 'high',
	};
	const labelledbyIconLink: IconLinkProps = {
		'aria-labelledby': 'external-label',
		href: '/settings',
		icon: 'add',
	};
	expectTypeOf<typeof iconLink>().toExtend<IconLinkProps>();
	expectTypeOf<typeof labelledbyIconLink>().toExtend<IconLinkProps>();

	// @ts-expect-error — neutral high is not a supported IconLink treatment
	const neutralHighIconLink: IconLinkProps = {
		'aria-label': 'Add',
		href: '/settings',
		icon: 'add',
		prominence: 'high',
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

	void iconLink;
	void criticalIconLink;
	void labelledbyIconLink;
	void neutralHighIconLink;
	void textIconLink;
	void buttonAppearanceIconLink;
	void missingHref;
	void unlabelledIconLink;
	void pendingIconLink;
	void pressActionIconLink;
});
