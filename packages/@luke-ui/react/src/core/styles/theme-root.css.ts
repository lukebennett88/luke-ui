import { lukeUiClassNames } from '../../shared/class-names.js';
import { vars } from '../../theme/contract.css.js';
import { classSelector } from './class-selector.js';
import { globalStyleInLayer } from './layered-style.css.js';

/** The base text and control colour, shared by the root rule and every colour-mode scope. */
const baseColor = {
	accentColor: vars.color.background.accent.solid.rest,
	color: vars.color.text.primary,
};

globalStyleInLayer('reset', classSelector(lukeUiClassNames.themeRoot), {
	...baseColor,
	...vars.font.body,
});

// A colour-mode scope below `<html>` gets new token values, but inherited properties keep the
// values its parent computed. Repaint the scope so its own text and surface follow its mode. The
// theme sets `color-scheme`. `<html>` is excluded: page scrollbars and the canvas follow it already.
globalStyleInLayer(
	'reset',
	":where(body[data-color-mode='light'], body[data-color-mode='dark'], body [data-color-mode='light'], body [data-color-mode='dark'])",
	{
		...baseColor,
		backgroundColor: vars.color.surface.base,
	},
);

// Unnamed `@container` size queries measure the root. Containment stays on the root alone, so
// those queries resolve against the same width everywhere in the document.
globalStyleInLayer('reset', ':where(:root)', { containerType: 'inline-size' });
