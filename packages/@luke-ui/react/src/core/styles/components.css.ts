import { vars } from '../../theme/contract.css.js';
import { comboboxSectionScopeClassName } from '../primitives/combobox/section-scope.js';
import { classSelector } from './class-selector.js';
import { globalStyleInLayer } from './layered-style.css.js';

globalStyleInLayer(
	'components',
	`${classSelector(comboboxSectionScopeClassName)} + ${classSelector(comboboxSectionScopeClassName)}`,
	{ borderBlockStart: `1px solid ${vars.color.border.decorative}` },
);
