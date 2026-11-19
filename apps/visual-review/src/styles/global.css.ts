import './app-tokens.css.js';
import { vars } from '@luke-ui/react/theme';
import { globalStyle } from '@vanilla-extract/css';

// The document scrolls, so sticky bars and section headers stay in view on every page.
globalStyle('body', {
	background: vars.color.background.surface.base,
	caretColor: vars.color.focus,
	color: vars.color.foreground.primary,
	margin: 0,
	minBlockSize: '100dvh',
	WebkitFontSmoothing: 'antialiased',
});

globalStyle('::selection', {
	background: `color-mix(in oklab, ${vars.color.focus} 25%, transparent)`,
});

globalStyle('html', {
	scrollbarColor: `${vars.color.border.control.rest} transparent`,
});
