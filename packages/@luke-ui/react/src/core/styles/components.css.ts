import { vars } from '../../theme/tokens.stylex.js';
import { comboboxSectionScopeAttribute } from '../primitives/combobox/section-scope.js';
import { globalStyleInLayer } from './layered-style.css.js';
import { attributeSelector } from './selectors.js';

// Written directly into the `recipes` layer (not a StyleX `recipes.priorityN` sublayer): a direct
// parent-layer rule beats a nested sublayer for normal declarations, which is what lets this
// retained selector reliably override Combobox's StyleX section recipe. See `layers.css.ts`.
globalStyleInLayer(
	'recipes',
	`${attributeSelector(comboboxSectionScopeAttribute)} + ${attributeSelector(comboboxSectionScopeAttribute)}`,
	{ borderBlockStart: `1px solid ${vars.color.border.decorative}` },
);
