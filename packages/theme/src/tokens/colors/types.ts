type Theme = {
	mode: 'light' | 'dark';
	foreground: {
		// Neutrals
		bold: string;
		boldInverted: string;
		boldDisabled: string;
		subtle: string;
		subtleInverted: string;
		subtleDisabled: string;

		// Primary
		primaryBold: string;
		primarySubtle: string;

		// Positive
		positiveBold: string;
		positiveSubtle: string;

		// Informative
		infoBold: string;
		infoSubtle: string;

		// Caution
		cautionBold: string;
		cautionSubtle: string;

		// Critical
		criticalBold: string;
		criticalSubtle: string;

		// Misc
		link: string;
	};
	background: {
		// Neutrals
		surface: string;
		surfaceDisabled: string;
		// page: string,
		// pageSubtle: string,
		// inputOnScene: string,
		// inputOnSurface: string,
		// inputDisabled: string,

		// Primary
		primarySubtle: string;
		primaryBold: string;

		// Positive
		positiveSubtle: string;
		positiveBold: string;

		// Informative
		infoSubtle: string;
		infoBold: string;

		// Caution
		cautionSubtle: string;
		cautionBold: string;

		// Critical
		criticalSubtle: string;
		criticalBold: string;
	};
	backgroundInteractions: {
		// Neutrals
		surfaceHover: string;
		surfacePressed: string;

		// Primary
		primarySubtleHover: string;
		primarySubtlePressed: string;
		primaryBoldHover: string;
		primaryBoldPressed: string;

		// Positive
		positiveSubtleHover: string;
		positiveSubtlePressed: string;
		positiveBoldHover: string;
		positiveBoldPressed: string;

		// Informative
		infoSubtleHover: string;
		infoSubtlePressed: string;
		infoBoldHover: string;
		infoBoldPressed: string;

		// Caution
		cautionSubtleHover: string;
		cautionSubtlePressed: string;
		cautionBoldHover: string;
		cautionBoldPressed: string;

		// Critical
		criticalSubtleHover: string;
		criticalSubtlePressed: string;
		criticalBoldHover: string;
		criticalBoldPressed: string;
	};
	border: {
		// Neutrals
		subtle: string;
		bold: string;

		// Primary
		primary: string;
		primaryBold: string;

		// // Input
		// input: string,
		// inputBold: string,

		// Positive
		positive: string;
		positiveBold: string;

		// Informative
		info: string;
		infoBold: string;

		// Caution
		caution: string;
		cautionBold: string;

		// Critical
		critical: string;
		criticalBold: string;
	};
};

type ColorMode = Theme['mode'];
type BackgroundTone = keyof Theme['background'];
type ForegroundTone = keyof Theme['foreground'];
type BorderTone = keyof Theme['border'];
type BackgroundInteraction = keyof Theme['backgroundInteractions'];

////////////////////////////////////////////////////////////////////////////////

export type {
	BackgroundInteraction,
	BackgroundTone,
	BorderTone,
	ColorMode,
	ForegroundTone,
	Theme,
};
