import { defineSlotRecipe } from '@pandacss/dev';
import type {
	IconSize,
	IconSizeToken,
	TextColorName,
	TextColorTokenFor,
} from '../types/token-unions.js';

const spinnerColors = {
	accent: 'intent.accent.text',
	danger: 'intent.danger.text',
	info: 'intent.info.text',
	primary: 'text.primary',
	secondary: 'text.secondary',
	success: 'intent.success.text',
	warning: 'intent.warning.text',
} as const satisfies { [Name in TextColorName]: TextColorTokenFor<Name> };

const spinnerSizes = {
	large: 'iconSize.large',
	medium: 'iconSize.medium',
	small: 'iconSize.small',
	xsmall: 'iconSize.xsmall',
} as const satisfies { [Size in IconSize]: IconSizeToken<Size> };

export const loadingSpinnerRecipe = defineSlotRecipe({
	className: 'loading-spinner',
	description: 'Spinner layout and determinate or indeterminate SVG state.',
	slots: ['indicator', 'root', 'state', 'svg'],
	base: {
		root: { color: 'currentColor', display: 'inline-flex', flexShrink: 0 },
		state: {},
		svg: { blockSize: '100%', display: 'block', inlineSize: '100%', transform: 'rotate(-90deg)' },
		indicator: { strokeDasharray: '100 100' },
	},
	defaultVariants: { mode: 'determinate', size: 'medium' },
	variants: {
		color: {
			accent: { root: { color: spinnerColors.accent } },
			danger: { root: { color: spinnerColors.danger } },
			info: { root: { color: spinnerColors.info } },
			primary: { root: { color: spinnerColors.primary } },
			secondary: { root: { color: spinnerColors.secondary } },
			success: { root: { color: spinnerColors.success } },
			warning: { root: { color: spinnerColors.warning } },
		},
		size: {
			large: { root: { blockSize: spinnerSizes.large, inlineSize: spinnerSizes.large } },
			medium: { root: { blockSize: spinnerSizes.medium, inlineSize: spinnerSizes.medium } },
			small: { root: { blockSize: spinnerSizes.small, inlineSize: spinnerSizes.small } },
			xsmall: { root: { blockSize: spinnerSizes.xsmall, inlineSize: spinnerSizes.xsmall } },
		},
		mode: {
			determinate: {
				indicator: {
					transitionDuration: 'fast',
					transitionProperty: 'stroke-dashoffset',
					transitionTimingFunction: 'exit',
				},
			},
			indeterminate: {
				state: {
					'@media (forced-colors: active)': { animationName: 'none' },
					'@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
					animationDuration: '1.2s',
					animationIterationCount: 'infinite',
					animationName: 'spin',
					animationTimingFunction: 'linear',
				},
				indicator: {
					'@media (forced-colors: active)': {
						animationName: 'none',
						strokeDasharray: '25 100',
						strokeDashoffset: 0,
					},
					'@media (prefers-reduced-motion: reduce)': {
						animationName: 'none',
						strokeDasharray: '25 100',
						strokeDashoffset: 0,
					},
					animationDuration: '2s',
					animationIterationCount: 'infinite',
					animationName: 'rubberBand',
					animationTimingFunction: 'cubic-bezier(0.42, 0, 0.58, 1)',
				},
			},
		},
	},
});
