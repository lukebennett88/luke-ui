import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { atLeastSiteHeaderDesktop } from '../lib/docs-container-queries.js';
import { siteGutter } from './site-header.css.js';

const SITE_FRAME_CONTAINER = 'site-frame';

// A sibling cannot read the header's container, so the frame is a container with the header's
// desktop threshold. It is as wide as the header, so both switch gutters together.
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
