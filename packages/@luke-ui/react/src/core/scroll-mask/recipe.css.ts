import type { ComplexStyleRule } from '@vanilla-extract/css';
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

function overflowingMask(timeline: 'scroll(self inline)' | 'scroll(self block)'): ComplexStyleRule {
	return {
		'@supports': {
			'(animation-timeline: scroll())': {
				animationDuration: '1ms',
				animationFillMode: 'both',
				animationName: `${revealStartFade}, ${revealEndFade}`,
				animationTimingFunction: 'linear',
				// Newer scroll-driven properties; cast until csstype covers the full surface.
				...({
					animationRange: `0 ${revealDistance}, calc(100% - ${revealDistance}) 100%`,
					animationTimeline: `${timeline}, ${timeline}`,
				} as ComplexStyleRule),
			},
		},
	};
}

const inlineOverflowMask = {
	maskImage: `linear-gradient(to right, transparent 0, #000 ${startFadeVar}, #000 calc(100% - ${endFadeVar}), transparent 100%)`,
	selectors: {
		'&:dir(rtl)': {
			maskImage: `linear-gradient(to left, transparent 0, #000 ${startFadeVar}, #000 calc(100% - ${endFadeVar}), transparent 100%)`,
		},
	},
	...overflowingMask('scroll(self inline)'),
} as const satisfies ComplexStyleRule;

const blockOverflowMask = {
	maskImage: `linear-gradient(to bottom, transparent 0, #000 ${startFadeVar}, #000 calc(100% - ${endFadeVar}), transparent 100%)`,
	...overflowingMask('scroll(self block)'),
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
			style: inlineOverflowMask,
			variants: { axis: 'inline', overflows: true },
		},
		{
			style: blockOverflowMask,
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
				overflowX: 'hidden',
				overflowY: 'auto',
			},
			inline: {
				overflowX: 'auto',
				overflowY: 'hidden',
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
