import { vars } from '../../../theme/contract.css.js';
import { classSelector } from '../../styles/class-selector.js';
import { globalStyleInLayer, style } from '../../styles/layered-style.css.js';

/** Marker class for combobox section adjacent-sibling borders. */
export const comboboxSectionScopeClassName = style({}, 'combobox-section');

globalStyleInLayer(
	'recipes',
	`${classSelector(comboboxSectionScopeClassName)} + ${classSelector(comboboxSectionScopeClassName)}`,
	{ borderBlockStart: `1px solid ${vars.color.border.decorative}` },
);
