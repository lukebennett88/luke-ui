import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

export const strong = styleInLayer('recipes', {
	fontWeight: vars.font.weight.emphasis,
});
