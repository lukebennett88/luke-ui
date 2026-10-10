import { vars } from '../../theme/contract.css.js';
import { focusRing } from './focus-ring.js';
import { globalStyleInLayer } from './layered-style.css.js';

// The global stylesheet: every rule here applies to the whole document. Keep it to rules that
// correct a cross-browser difference or replace a default almost every application overrides,
// without erasing native structure such as heading sizes, list markers, or button chrome.
// Component resets belong in the component's recipe. See
// `research/717-global-stylesheet-contract.md` before adding a rule.

// Pseudo-elements are invalid inside `:where()`, so they sit outside it.
globalStyleInLayer('reset', ':where(*), :where(*)::before, :where(*)::after', {
	boxSizing: 'border-box',
});

// Unnamed `@container` size queries measure the root. Containment stays on the root alone, so
// those queries resolve against the same width everywhere in the document.
globalStyleInLayer('reset', ':where(:root)', { containerType: 'inline-size' });

/** Text, accent, and surface colours, repainted in every colour-mode scope. */
const documentColors = {
	accentColor: vars.color.background.accent.solid.rest,
	backgroundColor: vars.color.surface.base,
	color: vars.color.text.primary,
};

// `<body>` carries the inherited baseline, so portals rendered into it need nothing extra. Its
// background propagates to the canvas. The line height is unitless so it scales with any font size
// that inherits it; `Text` sets its own type styles.
globalStyleInLayer('reset', ':where(body)', {
	...documentColors,
	...vars.font.body,
	lineHeight: 1.5,
	margin: 0,
});

// A colour-mode scope gets new token values, but inherited properties keep the values its parent
// computed. Repaint the scope so its own text and surface follow its mode. The theme sets
// `color-scheme`. `<html>` and `<body>` take their colours from the rule above.
globalStyleInLayer(
	'reset',
	":where(body [data-color-mode='light'], body [data-color-mode='dark'])",
	documentColors,
);

globalStyleInLayer('reset', ':where(button, input, select, textarea)', {
	font: 'inherit',
	margin: 0,
});

// Only the native pseudo-class: React Aria also sets `data-focus-visible` on wrappers such as
// labels and groups, so each recipe decides where that attribute draws a ring.
globalStyleInLayer('reset', ':where(:focus-visible)', {
	...focusRing(vars.color.border.focus),

	'@media': {
		'(forced-colors: active)': {
			outlineColor: 'Highlight',
		},
	},
});
