import { createResponsiveCssProperty } from '../styles/create-responsive-css-property.js';

/** Responsive negative `margin-inline-start` for `Bleed`. */
export const bleedInlineStartProperty = createResponsiveCssProperty(
	'bleed-inline-start',
	(valueVar) => {
		return { marginInlineStart: `calc(-1 * ${valueVar})` };
	},
);

/** Responsive negative `margin-inline-end` for `Bleed`. */
export const bleedInlineEndProperty = createResponsiveCssProperty(
	'bleed-inline-end',
	(valueVar) => {
		return { marginInlineEnd: `calc(-1 * ${valueVar})` };
	},
);

/** Responsive negative `margin-block-start` for `Bleed`. */
export const bleedBlockStartProperty = createResponsiveCssProperty(
	'bleed-block-start',
	(valueVar) => {
		return { marginBlockStart: `calc(-1 * ${valueVar})` };
	},
);

/** Responsive negative `margin-block-end` for `Bleed`. */
export const bleedBlockEndProperty = createResponsiveCssProperty('bleed-block-end', (valueVar) => {
	return { marginBlockEnd: `calc(-1 * ${valueVar})` };
});
