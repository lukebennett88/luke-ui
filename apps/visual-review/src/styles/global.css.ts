import { vars } from '@luke-ui/react/theme';
import { globalStyle } from '@vanilla-extract/css';

globalStyle('html, body, #root', {
	blockSize: '100%',
});

globalStyle('body', {
	background: vars.color.background.surface.subdued,
	color: vars.color.foreground.primary,
	margin: 0,
});
