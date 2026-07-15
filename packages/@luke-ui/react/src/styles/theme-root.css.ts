import { vars } from '../theme/contract.css.js';
import { classSelector, lukeUiClassNames } from './class-names.js';
import { globalStyleInLayer } from './layered-style.css.js';

globalStyleInLayer('theme', classSelector(lukeUiClassNames.themeRoot), {
	accentColor: vars.color.intent.accent.surface.solid,
	color: vars.color.text.primary,
	fontFamily: vars.font.family,
	...vars.font[300],
});
