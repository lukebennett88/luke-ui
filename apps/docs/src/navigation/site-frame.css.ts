import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { atLeastSiteHeaderDesktop } from './docs-container-queries.js';
import { siteGutter } from './site-header.css.js';

const SITE_FRAME_CONTAINER = 'site-frame';

// The panel cannot query the header's container, so the frame, which is as wide as the header,
// repeats its threshold.
export const frame = style({
	'@layer': {
		components: {
			containerName: SITE_FRAME_CONTAINER,
			containerType: 'inline-size',
		},
	},
});

// The panel's surface contrast against the chrome draws its edge, so it has no border or shadow.
export const insetPanel = style({
	'@layer': {
		components: {
			borderStartStartRadius: vars.radius.surface,
			marginInlineStart: siteGutter.compact,
			'@container': {
				[atLeastSiteHeaderDesktop(SITE_FRAME_CONTAINER)]: {
					marginInlineStart: siteGutter.desktop,
				},
			},
		},
	},
});
