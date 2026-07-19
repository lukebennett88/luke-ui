import { defineSlotRecipe } from '@pandacss/dev';

export const buttonComposedRecipe = defineSlotRecipe({
	className: 'button',
	description: 'Private content parts for the composed Button.',
	slots: ['content', 'label', 'spinnerOverlay'],
	base: {
		content: {
			alignItems: 'center',
			display: 'inline-flex',
			minInlineSize: 0,
			position: 'relative',
		},
		label: {
			alignItems: 'center',
			display: 'inline-flex',
			gap: '200',
			minInlineSize: 0,
		},
		spinnerOverlay: {
			'@media (forced-colors: active)': { color: 'ButtonText' },
			alignItems: 'center',
			display: 'flex',
			inset: 0,
			justifyContent: 'center',
			position: 'absolute',
		},
	},
	defaultVariants: { isPending: false },
	variants: { isPending: { false: {}, true: { label: { opacity: 0 } } } },
});
