import {
	amberDark,
	blueDark,
	grassDark,
	mauve,
	mauveDark,
	pinkDark,
	tomatoDark,
} from '@radix-ui/colors';

import type { Theme } from './types';

export const dsThemeDark: Theme = {
	mode: 'dark',
	foreground: {
		// Neutrals
		bold: mauveDark.mauve12,
		boldInverted: mauve.mauve12,
		boldDisabled: mauveDark.mauve8,
		subtle: mauveDark.mauve11,
		subtleInverted: mauve.mauve11,
		subtleDisabled: mauveDark.mauve7,

		// Primary
		primaryBold: pinkDark.pink12,
		primarySubtle: pinkDark.pink11,

		// Positive
		positiveBold: grassDark.grass12,
		positiveSubtle: grassDark.grass11,

		// Informative
		infoBold: blueDark.blue12,
		infoSubtle: blueDark.blue11,

		// Caution
		cautionBold: amberDark.amber12,
		cautionSubtle: amberDark.amber11,

		// Critical
		criticalBold: tomatoDark.tomato12,
		criticalSubtle: tomatoDark.tomato11,

		// Misc
		link: pinkDark.pink11,
	},
	background: {
		// Neutrals
		surface: mauveDark.mauve1,
		surfaceDisabled: mauveDark.mauve8,
		// page: '',
		// pageSubtle: '',
		// inputOnScene: '',
		// inputOnSurface: '',
		// inputDisabled: '',

		// Primary
		primarySubtle: pinkDark.pink1,
		primaryBold: pinkDark.pink9,

		// Positive
		positiveSubtle: grassDark.grass1,
		positiveBold: grassDark.grass9,

		// Informative
		infoSubtle: blueDark.blue1,
		infoBold: blueDark.blue9,

		// Caution
		cautionSubtle: amberDark.amber1,
		cautionBold: amberDark.amber9,

		// Critical
		criticalSubtle: tomatoDark.tomato1,
		criticalBold: tomatoDark.tomato9,
	},
	backgroundInteractions: {
		// Neutrals
		surfaceHover: mauveDark.mauve4,
		surfacePressed: mauveDark.mauve5,

		// Primary
		primarySubtleHover: pinkDark.pink4,
		primarySubtlePressed: pinkDark.pink5,
		primaryBoldHover: pinkDark.pink10,
		primaryBoldPressed: pinkDark.pink10,

		// Positive
		positiveSubtleHover: grassDark.grass4,
		positiveSubtlePressed: grassDark.grass5,
		positiveBoldHover: grassDark.grass10,
		positiveBoldPressed: grassDark.grass10,

		// Informative
		infoSubtleHover: blueDark.blue4,
		infoSubtlePressed: blueDark.blue5,
		infoBoldHover: blueDark.blue10,
		infoBoldPressed: blueDark.blue10,

		// Caution
		cautionSubtleHover: amberDark.amber4,
		cautionSubtlePressed: amberDark.amber5,
		cautionBoldHover: amberDark.amber10,
		cautionBoldPressed: amberDark.amber10,

		// Critical
		criticalSubtleHover: tomatoDark.tomato4,
		criticalSubtlePressed: tomatoDark.tomato5,
		criticalBoldHover: tomatoDark.tomato10,
		criticalBoldPressed: tomatoDark.tomato11,
	},
	border: {
		// Neutrals
		subtle: mauveDark.mauve6,
		bold: mauveDark.mauve8,

		// Primary
		primary: pinkDark.pink6,
		primaryBold: pinkDark.pink8,

		// // Input
		// input: mauveDark.mauve6,
		// inputBold: mauveDark.mauve8,

		// Positive
		positive: grassDark.grass6,
		positiveBold: grassDark.grass8,

		// Informative
		info: blueDark.blue6,
		infoBold: blueDark.blue8,

		// Caution
		caution: amberDark.amber6,
		cautionBold: amberDark.amber8,

		// Critical
		critical: amberDark.amber6,
		criticalBold: amberDark.amber8,
	},
} as const;
