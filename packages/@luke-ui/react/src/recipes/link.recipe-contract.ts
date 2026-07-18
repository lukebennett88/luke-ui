export const linkToneVariants = {
	accent: {
		color: 'intent.accent.text',
		'&[data-hovered="true"]:not([data-disabled="true"])': {
			color: 'intent.accent.textHover',
		},
		'&[data-pressed="true"]:not([data-disabled="true"])': {
			color: 'intent.accent.textHover',
		},
	},
	neutral: {
		color: 'text.secondary',
		'&[data-hovered="true"]:not([data-disabled="true"])': { color: 'text.primary' },
		'&[data-pressed="true"]:not([data-disabled="true"])': { color: 'text.primary' },
	},
};

export type LinkTone = keyof typeof linkToneVariants;
