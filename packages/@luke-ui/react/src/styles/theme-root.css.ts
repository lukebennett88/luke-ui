import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme/contract.css.js';
import { classSelector, lukeUiClassNames } from './class-names.js';

globalStyle(classSelector(lukeUiClassNames.themeRoot), {
	'@layer': {
		theme: {
			accentColor: vars.color.intent.accent.surface.solid,
			color: vars.color.text.primary,
			fontFamily: vars.font.family,
			...vars.font[300],
		},
	},
});
