import { expectTypeOf, test } from 'vite-plus/test';
import type { LinkProps } from './link.js';

test('Link accepts only navigation treatments', () => {
	const buttonLink: LinkProps = { appearance: 'button', href: '/settings', prominence: 'high' };
	const textLink: LinkProps = { href: '/settings', prominence: 'high' };
	expectTypeOf<typeof buttonLink>().toExtend<LinkProps>();

	// @ts-expect-error — Link always requires a navigation destination
	const missingHref: LinkProps = {};
	// @ts-expect-error — text Links do not use button content slots
	const textLinkContent: LinkProps = { endContent: 'next', href: '/settings' };
	// @ts-expect-error — Link prominence describes navigation hierarchy without a tone
	const criticalLink: LinkProps = { href: '/settings', tone: 'critical' };
	// @ts-expect-error — text Links do not use control sizing
	const textLinkSize: LinkProps = { href: '/settings', size: 'small' };

	void buttonLink;
	void textLink;
	void missingHref;
	void textLinkContent;
	void criticalLink;
	void textLinkSize;
});
