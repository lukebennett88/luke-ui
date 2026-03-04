import { classSelector, lukeUiClassNames } from './class-names.js';
import { globalStyleInLayer } from './layered-style.css.js';
import { vars } from './vars.css.js';

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

globalStyleInLayer('reset', `${root} :where(:disabled, [data-disabled])`, {
	cursor: 'not-allowed',
});

globalStyleInLayer('reset', `${root} :where(:focus-visible)`, {
	outlineColor: vars.themeColor.focusRingColor,
	outlineOffset: vars.borderWidth.thick,
	outlineStyle: 'solid',
	outlineWidth: vars.borderWidth.thick,
});
