import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer } from './layered-style.css.js';

globalStyleInLayer('reset', 'body', {
	accentColor: vars.color.background.accent.solid.rest,
	color: vars.color.text.primary,
	...vars.font.body,
});
