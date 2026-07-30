import { vars } from '../theme/contract.css.js';
import { classSelector, lukeUiClassNames } from './class-names.js';
import { globalStyleInLayer } from './layered-style.css.js';

globalStyleInLayer('theme', classSelector(lukeUiClassNames.themeRoot), {
	accentColor: vars.color.background.accent.solid.rest,
	color: vars.color.text.primary,
	fontFamily: vars.font.family.body,
	...vars.font[300],
});
