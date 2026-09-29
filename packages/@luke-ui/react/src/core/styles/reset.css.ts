import { vars } from '../../theme/contract.css.js';
import { proseScopeClassName } from '../prose/scope.css.js';
import { classSelector } from './class-selector.js';
import { focusRing } from './focus-ring.js';
import { globalStyleInLayer } from './layered-style.css.js';

globalStyleInLayer('reset', '*, *::before, *::after', {
	boxSizing: 'border-box',
});

globalStyleInLayer('reset', ':where(blockquote, dl, dd, figure, p)', {
	margin: 0,
});

globalStyleInLayer('reset', ':where(h1, h2, h3, h4, h5, h6)', {
	font: 'unset',
	margin: 0,
});

globalStyleInLayer('reset', ':where(ol, ul)', {
	margin: 0,
	padding: 0,
});

// Strip markers from interface lists. Typed ols inside Prose keep native markers via HTML
// presentational hints — author `list-style` would override those hints, and Chromium/Safari
// cannot restate `type` case-sensitively in CSS, so the exemption instead rides the Prose recipe's
// scope class (`proseScopeClassName`), which `proseRecipe()` and `<Prose>` apply identically.
globalStyleInLayer(
	'reset',
	`:where(ul, ol:not([type]), ol[type]:not(${classSelector(proseScopeClassName)} *))`,
	{
		listStyle: 'none',
	},
);

globalStyleInLayer('reset', ':where(table)', {
	borderCollapse: 'collapse',
	borderSpacing: 0,
});

globalStyleInLayer('reset', ':where(caption, th)', {
	textAlign: 'inherit',
});

globalStyleInLayer('reset', ':where(th, td)', {
	padding: 0,
});

globalStyleInLayer('reset', ':where(button, select, label)', {
	WebkitTapHighlightColor: 'transparent',
});

globalStyleInLayer(
	'reset',
	`:where(button, select, input, textarea, [type='button'], [type='reset'], [type='submit'])`,
	{
		font: 'inherit',
	},
);

globalStyleInLayer(
	'reset',
	`:where(button, [type='button'], [type='reset'], [type='submit'])`,
	{
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		borderStyle: 'none',
		borderWidth: 0,
		color: 'inherit',
		padding: 0,
	},
);

globalStyleInLayer('reset', ':where(input, textarea, select)', {
	color: 'inherit',
	margin: 0,
});

globalStyleInLayer('reset', ':where(:disabled, [data-disabled="true"])', {
	cursor: 'not-allowed',
});

// The default focus ring, defined once here as the base for every focusable control. Recipes only
// restate it when they deviate — focus-within on a group, or a ring on a non-focusable box like a
// checkbox's indicator. `[data-focus-visible="true"]` mirrors native `:focus-visible` with React
// Aria's deterministic signal, so both the browser heuristic and the attribute drive the same ring.
globalStyleInLayer('reset', ':where(:focus-visible, [data-focus-visible="true"])', {
	...focusRing(vars.color.border.focus),

	'@media': {
		'(forced-colors: active)': {
			outlineColor: 'Highlight',
		},
	},
});

globalStyleInLayer('reset', '*, *::before, *::after', {
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			animation: 'none',
			transition: 'none',
		},
	},
});
