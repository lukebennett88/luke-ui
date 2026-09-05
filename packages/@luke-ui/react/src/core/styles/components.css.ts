import { vars } from '../../theme/tokens.stylex.js';
import { comboboxSectionScopeAttribute } from '../primitives/combobox/section-scope.js';
import { globalStyleInLayer } from './layered-style.css.js';
import { attributeSelector } from './selectors.js';

// Keep this retained selector in the direct `recipes` layer so it overrides Combobox's nested
// StyleX section recipe.
globalStyleInLayer(
	'recipes',
	`${attributeSelector(comboboxSectionScopeAttribute)} + ${attributeSelector(comboboxSectionScopeAttribute)}`,
	{ borderBlockStart: `1px solid ${vars.color.border.decorative}` },
);
