import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme/contract.css.js';
import { classSelector, lukeUiClassNames } from './class-names.js';
import { focusRing } from './focus-ring.js';

const root = classSelector(lukeUiClassNames.resetRoot);

globalStyle(`${root}, ${root} *, ${root} *::before, ${root} *::after`, {
	'@layer': { reset: { boxSizing: 'border-box' } },
});

globalStyle(`${root} :where(blockquote, dl, dd, figure, p)`, {
	'@layer': { reset: { margin: 0 } },
});

globalStyle(`${root} :where(h1, h2, h3, h4, h5, h6)`, {
	'@layer': { reset: { font: 'unset', margin: 0 } },
});

globalStyle(`${root} :where(ol, ul)`, {
	'@layer': { reset: { listStyle: 'none', margin: 0, padding: 0 } },
});

globalStyle(`${root} :where(table)`, {
	'@layer': { reset: { borderCollapse: 'collapse', borderSpacing: 0 } },
});

globalStyle(`${root} :where(caption, th)`, {
	'@layer': { reset: { textAlign: 'inherit' } },
});

globalStyle(`${root} :where(th, td)`, { '@layer': { reset: { padding: 0 } } });

globalStyle(`${root} :where(button, select, label)`, {
	'@layer': { reset: { WebkitTapHighlightColor: 'transparent' } },
});

globalStyle(
	`${root} :where(button, select, input, textarea, [type='button'], [type='reset'], [type='submit'])`,
	{
		'@layer': { reset: { font: 'inherit' } },
	},
);

globalStyle(`${root} :where(button, [type='button'], [type='reset'], [type='submit'])`, {
	'@layer': {
		reset: {
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderStyle: 'none',
			borderWidth: 0,
			color: 'inherit',
			padding: 0,
		},
	},
});

globalStyle(`${root} :where(input, textarea, select)`, {
	'@layer': { reset: { color: 'inherit', margin: 0 } },
});

globalStyle(`${root} :where(:disabled, [data-disabled="true"])`, {
	'@layer': { reset: { cursor: 'not-allowed' } },
});

globalStyle(`${root} :where(:focus-visible)`, {
	'@layer': {
		reset: {
			...focusRing(vars.color.border.focus),

			'@media': {
				'(forced-colors: active)': {
					outlineColor: 'Highlight',
				},
			},
		},
	},
});

globalStyle(`${root}, ${root} *, ${root} *::before, ${root} *::after`, {
	'@layer': {
		reset: {
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					animation: 'none',
					transition: 'none',
				},
			},
		},
	},
});
