import { classSelector, lukeUiClassNames } from '../../shared/class-names.js';
import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer } from './layered-style.css.js';

globalStyleInLayer('theme', classSelector(lukeUiClassNames.themeRoot), {
	accentColor: vars.color.background.accent.solid.rest,
	color: vars.color.text.primary,
	...vars.font.body,
});
