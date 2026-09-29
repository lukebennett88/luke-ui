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
	minBlockSize: '100%',
});

globalStyle('body', {
	background: vars.color.surface.canvas,
	color: vars.color.text.primary,
	fontSize: 'var(--app-font-size)',
	margin: 0,
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
