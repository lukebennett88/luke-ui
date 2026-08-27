import { lukeUiClassNames } from '../../shared/class-names.js';
import { vars } from '../../theme/contract.css.js';
import { classSelector } from './class-selector.js';
import { focusRing } from './focus-ring.js';
import { globalStyleInLayer } from './layered-style.css.js';

const root = classSelector(lukeUiClassNames.resetRoot);

globalStyleInLayer('reset', `${root}, ${root} *, ${root} *::before, ${root} *::after`, {
	boxSizing: 'border-box',
});

globalStyleInLayer('reset', `${root} :where(blockquote, dl, dd, figure, p)`, {
	margin: 0,
});

globalStyleInLayer('reset', `${root} :where(h1, h2, h3, h4, h5, h6)`, {
	font: 'unset',
	margin: 0,
});

globalStyleInLayer('reset', `${root} :where(ol, ul)`, {
	listStyle: 'none',
	margin: 0,
	padding: 0,
});

globalStyleInLayer('reset', `${root} :where(table)`, {
	borderCollapse: 'collapse',
	borderSpacing: 0,
});

globalStyleInLayer('reset', `${root} :where(caption, th)`, {
	textAlign: 'inherit',
});

globalStyleInLayer('reset', `${root} :where(th, td)`, {
	padding: 0,
});

globalStyleInLayer('reset', `${root} :where(button, select, label)`, {
	WebkitTapHighlightColor: 'transparent',
});

globalStyleInLayer(
	'reset',
	`${root} :where(button, select, input, textarea, [type='button'], [type='reset'], [type='submit'])`,
	{
		font: 'inherit',
	},
);

globalStyleInLayer(
	'reset',
	`${root} :where(button, [type='button'], [type='reset'], [type='submit'])`,
	{
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		borderStyle: 'none',
		borderWidth: 0,
		color: 'inherit',
		padding: 0,
	},
);

globalStyleInLayer('reset', `${root} :where(input, textarea, select)`, {
	color: 'inherit',
	margin: 0,
});

globalStyleInLayer('reset', `${root} :where(:disabled, [data-disabled="true"])`, {
	cursor: 'not-allowed',
});

// The default focus ring, defined once here as the base for every focusable control. Recipes only
// restate it when they deviate — focus-within on a group, or a ring on a non-focusable box like a
// checkbox's indicator. `[data-focus-visible="true"]` mirrors native `:focus-visible` with React
// Aria's deterministic signal, so both the browser heuristic and the attribute drive the same ring.
globalStyleInLayer('reset', `${root} :where(:focus-visible, [data-focus-visible="true"])`, {
	...focusRing(vars.color.border.focus),

	'@media': {
		'(forced-colors: active)': {
			outlineColor: 'Highlight',
		},
	},
});

globalStyleInLayer('reset', `${root}, ${root} *, ${root} *::before, ${root} *::after`, {
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			animation: 'none',
			transition: 'none',
		},
	},
});
