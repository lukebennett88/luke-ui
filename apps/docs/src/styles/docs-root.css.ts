import { style } from '@vanilla-extract/css';

// Docs size queries are unnamed `@container` queries. They resolve against `:root`, which gets
// `container-type: inline-size` from the Luke UI stylesheet imported in `app.css`. No element below
// the root is a container, so the queries measure the root width, as viewport queries did. See
// `lib/docs-container-queries.ts` before adding an inner container.
export const docsRoot = style({
	'@layer': {
		base: {
			display: 'flex',
			flexDirection: 'column',
			minBlockSize: '100dvh',
		},
	},
});
