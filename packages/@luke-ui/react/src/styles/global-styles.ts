import { defineGlobalStyles } from '@pandacss/dev';
import { vars } from '../theme/panda-tokens.js';
import { classSelector, lukeUiClassNames } from './class-names.js';
import { focusRing } from './focus-ring.js';

const resetRoot = classSelector(lukeUiClassNames.resetRoot);
const themeRoot = classSelector(lukeUiClassNames.themeRoot);

export const globalStyles = defineGlobalStyles({
	'@layer reset': {
		[`${resetRoot}, ${resetRoot} *, ${resetRoot} *::before, ${resetRoot} *::after`]: {
			boxSizing: 'border-box',
			'@media (prefers-reduced-motion: reduce)': {
				animation: 'none',
				transition: 'none',
			},
		},
		[`${resetRoot} :where(blockquote, dl, dd, figure, p)`]: { margin: 0 },
		[`${resetRoot} :where(h1, h2, h3, h4, h5, h6)`]: { font: 'unset', margin: 0 },
		[`${resetRoot} :where(ol, ul)`]: { listStyle: 'none', margin: 0, padding: 0 },
		[`${resetRoot} :where(table)`]: { borderCollapse: 'collapse', borderSpacing: 0 },
		[`${resetRoot} :where(caption, th)`]: { textAlign: 'inherit' },
		[`${resetRoot} :where(th, td)`]: { padding: 0 },
		[`${resetRoot} :where(button, select, label)`]: { WebkitTapHighlightColor: 'transparent' },
		[`${resetRoot} :where(button, select, input, textarea, [type='button'], [type='reset'], [type='submit'])`]:
			{ font: 'inherit' },
		[`${resetRoot} :where(button, [type='button'], [type='reset'], [type='submit'])`]: {
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderStyle: 'none',
			borderWidth: 0,
			color: 'inherit',
			padding: 0,
		},
		[`${resetRoot} :where(input, textarea, select)`]: { color: 'inherit', margin: 0 },
		[`${resetRoot} :where(:disabled, [data-disabled="true"])`]: { cursor: 'not-allowed' },
		[`${resetRoot} :where(:focus-visible)`]: {
			...focusRing(vars.color.border.focus),
			'@media (forced-colors: active)': { outlineColor: 'Highlight' },
		},
	},
	'@layer base': {
		[themeRoot]: {
			accentColor: vars.color.intent.accent.surface.solid,
			color: vars.color.text.primary,
			fontFamily: vars.font.family,
			...vars.font[300],
		},
	},
});
