import type { ComplexStyleRule, StyleRule } from '@vanilla-extract/css';
import { createVar, keyframes } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Adaptive mask depth: a fraction of the scrollport, capped at `sp40`. */
const maskSize = `min(12%, ${vars.space.sp40})`;

/** Scroll distance over which each edge fade eases in or out. */
const revealDistance = vars.space.sp96;

const startFadeVar = createVar({
	inherits: false,
	initialValue: '0px',
	syntax: '<length-percentage>',
});

const endFadeVar = createVar({
	inherits: false,
	initialValue: '0px',
	syntax: '<length-percentage>',
});

const revealStartFade = keyframes({
	from: { vars: { [startFadeVar]: '0px' } },
	to: { vars: { [startFadeVar]: maskSize } },
});

const revealEndFade = keyframes({
	from: { vars: { [endFadeVar]: maskSize } },
	to: { vars: { [endFadeVar]: '0px' } },
});

function overflowingMask(timeline: 'scroll(self inline)' | 'scroll(self block)'): StyleRule {
	// Scroll-driven properties are newer than the StyleRule surface; cast the support block.
	return {
		'@supports': {
			'(animation-timeline: scroll())': {
				animationDuration: '1ms',
				animationFillMode: 'both',
				animationName: `${revealStartFade}, ${revealEndFade}`,
				animationRange: `0 ${revealDistance}, calc(100% - ${revealDistance}) 100%`,
				animationTimeline: `${timeline}, ${timeline}`,
				animationTimingFunction: 'linear',
			} as StyleRule,
		},
	};
}

function maskGradient(to: 'left' | 'right' | 'top' | 'bottom'): string {
	return `linear-gradient(to ${to}, transparent 0, #000 ${startFadeVar}, #000 calc(100% - ${endFadeVar}), transparent 100%)`;
}

/**
 * Physical mask direction comes from `data-scroll-mask-end`, set by ScrollMask from the element's
 * writing mode and direction. Logical gradient keywords are not available in current Chromium.
 */
const physicalEndMasks = {
	selectors: {
		'&[data-scroll-mask-end="bottom"]': { maskImage: maskGradient('bottom') },
		'&[data-scroll-mask-end="left"]': { maskImage: maskGradient('left') },
		'&[data-scroll-mask-end="right"]': { maskImage: maskGradient('right') },
		'&[data-scroll-mask-end="top"]': { maskImage: maskGradient('top') },
	},
} as const satisfies ComplexStyleRule;

/** Recipe for a scrollport that masks overflow edges. */
export const scrollMaskRecipe = recipe({
	base: {
		// Min size 0 so the scrollport can shrink inside flex/grid parents.
		minBlockSize: 0,
		minInlineSize: 0,
	},
	compoundVariants: [
		{
			style: [physicalEndMasks, overflowingMask('scroll(self inline)')],
			variants: { axis: 'inline', overflows: true },
		},
		{
			style: [physicalEndMasks, overflowingMask('scroll(self block)')],
			variants: { axis: 'block', overflows: true },
		},
	],
	defaultVariants: {
		axis: 'inline',
		overflows: false,
	},
	variants: {
		axis: {
			block: {
				overflowBlock: 'auto',
				overflowInline: 'hidden',
			},
			inline: {
				overflowBlock: 'hidden',
				overflowInline: 'auto',
			},
		},
		overflows: {
			false: {},
			true: {},
		},
	},
});

/** Variant type for the `ScrollMask` recipe. */
export type ScrollMaskRecipeVariants = RecipeSelection<typeof scrollMaskRecipe>;
