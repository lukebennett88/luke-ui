import { expectTypeOf, test } from 'vite-plus/test';
import type { LinkProps } from './link.js';

test('Link accepts only navigation treatments', () => {
	const buttonLink: LinkProps = { appearance: 'button', href: '/settings', tone: 'accent' };
	const textLink: LinkProps = { href: '/settings', tone: 'accent', prominence: 'high' };
	expectTypeOf<typeof buttonLink>().toExtend<LinkProps>();

	// @ts-expect-error — Link always requires a navigation destination
	const missingHref: LinkProps = {};
	// @ts-expect-error — text Links do not use button content slots
	const textLinkContent: LinkProps = { endContent: 'next', href: '/settings' };
	// @ts-expect-error — critical navigation treatments are not supported initially
	const criticalLink: LinkProps = { href: '/settings', tone: 'critical' };

	void buttonLink;
	void textLink;
	void missingHref;
	void textLinkContent;
	void criticalLink;
});
