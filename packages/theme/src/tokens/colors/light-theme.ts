import {
	amber,
	blue,
	grass,
	mauve,
	mauveDark,
	pink,
	tomato,
} from '@radix-ui/colors';

import type { Theme } from './types';

export const dsThemeLight: Theme = {
	mode: 'light',
	foreground: {
		// Neutrals
		bold: mauve.mauve12,
		boldInverted: mauveDark.mauve12,
		boldDisabled: mauve.mauve8,
		subtle: mauve.mauve11,
		subtleInverted: mauveDark.mauve11,
		subtleDisabled: mauve.mauve7,

		// Primary
		primaryBold: pink.pink12,
		primarySubtle: pink.pink11,

		// Positive
		positiveBold: grass.grass12,
		positiveSubtle: grass.grass11,

		// Informative
		infoBold: blue.blue12,
		infoSubtle: blue.blue11,

		// Caution
		cautionBold: amber.amber12,
		cautionSubtle: amber.amber11,

		// Critical
		criticalBold: tomato.tomato12,
		criticalSubtle: tomato.tomato11,

		// Misc
		link: pink.pink11,
	},
	background: {
		// Neutrals
		surface: mauve.mauve1,
		surfaceDisabled: mauve.mauve8,
		// page: '',
		// pageSubtle: '',
		// inputOnScene: '',
		// inputOnSurface: '',
		// inputDisabled: '',

		// Primary
		primarySubtle: pink.pink1,
		primaryBold: pink.pink9,

		// Positive
		positiveSubtle: grass.grass1,
		positiveBold: grass.grass9,

		// Informative
		infoSubtle: blue.blue1,
		infoBold: blue.blue9,

		// Caution
		cautionSubtle: amber.amber1,
		cautionBold: amber.amber9,

		// Critical
		criticalSubtle: tomato.tomato1,
		criticalBold: tomato.tomato9,
	},
	backgroundInteractions: {
		// Neutrals
		surfaceHover: mauve.mauve4,
		surfacePressed: mauve.mauve5,

		// Primary
		primarySubtleHover: pink.pink4,
		primarySubtlePressed: pink.pink5,
		primaryBoldHover: pink.pink10,
		primaryBoldPressed: pink.pink10,

		// Positive
		positiveSubtleHover: grass.grass4,
		positiveSubtlePressed: grass.grass5,
		positiveBoldHover: grass.grass10,
		positiveBoldPressed: grass.grass10,

		// Informative
		infoSubtleHover: blue.blue4,
		infoSubtlePressed: blue.blue5,
		infoBoldHover: blue.blue10,
		infoBoldPressed: blue.blue10,

		// Caution
		cautionSubtleHover: amber.amber4,
		cautionSubtlePressed: amber.amber5,
		cautionBoldHover: amber.amber10,
		cautionBoldPressed: amber.amber10,

		// Critical
		criticalSubtleHover: tomato.tomato4,
		criticalSubtlePressed: tomato.tomato5,
		criticalBoldHover: tomato.tomato10,
		criticalBoldPressed: tomato.tomato11,
	},
	border: {
		// Neutrals
		subtle: mauve.mauve6,
		bold: mauve.mauve8,

		// Primary
		primary: pink.pink6,
		primaryBold: pink.pink8,

		// // Input
		// input: mauve.mauve6,
		// inputBold: mauve.mauve8,

		// Positive
		positive: grass.grass6,
		positiveBold: grass.grass8,

		// Informative
		info: blue.blue6,
		infoBold: blue.blue8,

		// Caution
		caution: amber.amber6,
		cautionBold: amber.amber8,

		// Critical
		critical: amber.amber6,
		criticalBold: amber.amber8,
	},
} as const;
