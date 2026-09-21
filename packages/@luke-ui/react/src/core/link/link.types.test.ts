import { expect, test } from 'vite-plus/test';
import type { LinkProps } from './link.js';

const withRef: LinkProps = { href: '/settings', ref: null };

// @ts-expect-error — Link always requires a navigation destination
const missingHref: LinkProps = {};
// @ts-expect-error — text Links do not use button content slots
const textLinkContent: LinkProps = { endContent: 'next', href: '/settings' };
// @ts-expect-error — Link has no tone prop
const criticalLink: LinkProps = { href: '/settings', tone: 'critical' };
// @ts-expect-error — text Links do not use control sizing
const textLinkSize: LinkProps = { href: '/settings', size: 'small' };

test('Link supports ref and rejects unsupported props', () => {
	expect([withRef, missingHref, textLinkContent, criticalLink, textLinkSize]).toHaveLength(5);
});
