import { expect, test } from 'vite-plus/test';
import type { LinkProps } from './link.js';

// @ts-expect-error — Link always requires a navigation destination
const missingHref: LinkProps = {};
// @ts-expect-error — text Links do not use button content slots
const textLinkContent: LinkProps = { endContent: 'next', href: '/settings' };
// @ts-expect-error — Link has no tone prop
const criticalLink: LinkProps = { href: '/settings', tone: 'critical' };
// @ts-expect-error — text Links do not use control sizing
const textLinkSize: LinkProps = { href: '/settings', size: 'small' };

test('Link rejects the props it does not support', () => {
	expect([missingHref, textLinkContent, criticalLink, textLinkSize]).toHaveLength(4);
});
