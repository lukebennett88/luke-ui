import { vars } from '@luke-ui/react/theme';
import { globalStyle } from '@vanilla-extract/css';

globalStyle('html', {
	fontSize: '87.5%',
});

globalStyle('html[data-font-size="small"]', {
	fontSize: '81.25%',
});

globalStyle('html[data-font-size="large"]', {
	fontSize: '100%',
});

globalStyle('html, body, #root', {
	blockSize: '100%',
	overflow: 'hidden',
});

globalStyle('html, body', {
	inset: 0,
	position: 'fixed',
	inlineSize: '100%',
});

globalStyle('body', {
	background: vars.color.surface.subdued,
	caretColor: vars.color.background.accent.solid.rest,
	color: vars.color.text.primary,
	margin: 0,
});

globalStyle('::selection', {
	background: vars.color.background.accent.subtle.pressed,
	color: vars.color.text.primary,
});

globalStyle(
	':root[data-pointer-cursor="false"] :is(button, a, [role="button"], [role="menuitem"], [role="option"], label)',
	{
		cursor: 'default',
	},
);

globalStyle(
	':root[data-pointer-cursor="true"] :is(button, a, [role="button"], [role="menuitem"], [role="option"], label):not(:disabled, [data-disabled], [aria-disabled="true"])',
	{
		cursor: 'pointer',
	},
);

globalStyle(':root[data-underline-links="true"] a', {
	textDecoration: 'underline',
	textUnderlineOffset: '0.2em',
});
