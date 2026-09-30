import { vars } from '@luke-ui/react/theme';
import { globalStyle } from '@vanilla-extract/css';

globalStyle(':root', {
	vars: {
		'--app-font-size': '14px',
	},
});

globalStyle(':root[data-font-size="small"]', {
	vars: {
		'--app-font-size': '13px',
	},
});

globalStyle(':root[data-font-size="large"]', {
	vars: {
		'--app-font-size': '15px',
	},
});

globalStyle('html, body, #root', {
	blockSize: '100%',
	overflow: 'hidden',
});

globalStyle('html, body', {
	inset: 0,
	position: 'fixed',
});

globalStyle('body', {
	// Match the shell well; light recessed is pure white and too close to floating.
	background: vars.color.surface.canvas,
	caretColor: vars.color.background.accent.solid.rest,
	color: vars.color.text.primary,
	fontSize: 'var(--app-font-size)',
	margin: 0,
});

globalStyle('::selection', {
	background: `color-mix(in oklab, ${vars.color.background.accent.solid.rest} 28%, transparent)`,
});

globalStyle(':root[data-pointer-cursor="true"] button', {
	cursor: 'pointer',
});

globalStyle(':root[data-pointer-cursor="true"] a', {
	cursor: 'pointer',
});

globalStyle(':root[data-pointer-cursor="true"] [role="button"]', {
	cursor: 'pointer',
});

globalStyle(':root[data-pointer-cursor="true"] label', {
	cursor: 'pointer',
});

globalStyle(':root[data-underline-links="true"] a', {
	textDecoration: 'underline',
});

globalStyle(':root[data-disable-animated-images="true"] img', {
	animationPlayState: 'paused',
});
