import { breakpoints } from '@luke-ui/react/theme';
import { createVar, globalStyle } from '@vanilla-extract/css';
import { TOP_BAR_HEIGHT } from './sizes.js';

/**
 * The app's own values that the theme has no token for. Colours have light and dark values; sizes
 * change for the phone layout. Everything else comes from the theme's `vars`.
 */
export const appVars = {
	/**
	 * The marker drawn around a difference. It sits over screenshots of Luke UI's own themes, which
	 * use red, amber, green, blue and teal for their states, so it is a magenta none of them use. It
	 * is the same in both colour schemes, because a light capture can sit in a dark page.
	 */
	difference: createVar(),
	/** The neutral mid-grey the screenshots sit on, darker than every surface in light mode. */
	stage: createVar(),
	/** Height of the sticky top bar. */
	topBarHeight: createVar(),
};

// Set on `body`, so the size query measures the root container.
globalStyle('body', {
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			vars: {
				[appVars.topBarHeight]: `${TOP_BAR_HEIGHT.compact}px`,
			},
		},
	},
	'@media': {
		'(prefers-color-scheme: dark)': {
			vars: {
				[appVars.stage]: 'oklch(0.259 0.005 280)',
			},
		},
	},
	vars: {
		[appVars.difference]: 'oklch(0.56 0.26 345)',
		[appVars.stage]: 'oklch(0.924 0.002 280)',
		[appVars.topBarHeight]: `${TOP_BAR_HEIGHT.regular}px`,
	},
});
