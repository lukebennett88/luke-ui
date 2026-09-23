import type { StyleRule } from '@vanilla-extract/css';
import { createVar, keyframes } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import { style } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Adaptive mask depth: a fraction of the scrollport, capped at `sp40`. */
const maskSize = `min(12%, ${vars.space.sp40})`;

/** Scroll distance over which each edge fade eases in or out. */
const revealDistance = vars.space.sp96;

/**
 * Extra mask coverage beyond the border box so the standard focus outline
 * (`outline-width` 2px + `outline-offset` 2px) stays in an opaque gutter and is not faded.
 */
const focusRingGutter = '8px';

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

/** Physical gradient angles for logical-end sides. */
const maskAngle = {
	bottom: 180,
	left: 270,
	right: 90,
	top: 0,
} as const;

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

/**
 * Content fade plus an opaque outline gutter. Chromium masks `outline` with `mask-image`; extending
 * an opaque frame beyond the border box keeps the standard focus ring visible without clearing the
 * overflow fade.
 */
function maskLayers(side: keyof typeof maskAngle): StyleRule {
	const fade = `linear-gradient(${String(maskAngle[side])}deg, transparent 0, #000 ${startFadeVar}, #000 calc(100% - ${endFadeVar}), transparent 100%)`;
	return {
		maskClip: 'no-clip',
		maskComposite: 'exclude, subtract, add',
		maskImage: `linear-gradient(#000, #000), linear-gradient(#000, #000), ${fade}`,
		maskPosition: `-4px -4px, 0 0, 0 0`,
		maskRepeat: 'no-repeat',
		maskSize: `calc(100% + ${focusRingGutter}) calc(100% + ${focusRingGutter}), 100% 100%, 100% 100%`,
		// WebKit uses a different composite vocabulary for the same layering.
		WebkitMaskComposite: 'xor, source-out, source-over',
	};
}

/** Recipe for ScrollMask layout. Overflow/mask state is not a public recipe variant. */
export const scrollMaskRecipe = recipe({
	base: {
		// Min size 0 so the scrollport can shrink inside flex/grid parents.
		minBlockSize: 0,
		minInlineSize: 0,
	},
	defaultVariants: {
		axis: 'inline',
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
	},
});

/** Variant type for the public `ScrollMask` recipe. */
export type ScrollMaskRecipeVariants = RecipeSelection<typeof scrollMaskRecipe>;

/** Resting fade amounts before scroll timelines resolve (logical start of the scrollport). */
const overflowingFadeVars = {
	vars: {
		[endFadeVar]: maskSize,
		[startFadeVar]: '0px',
	},
} as const;

/**
 * Private overflowing styles. Physical mask end comes from `data-scroll-mask-end`, measured from the
 * element's used writing mode and CSS `direction`.
 */
export const scrollMaskOverflowingInline = style({
	...overflowingFadeVars,
	...overflowingMask('scroll(self inline)'),
	selectors: {
		'&[data-scroll-mask-end="bottom"]': maskLayers('bottom'),
		'&[data-scroll-mask-end="left"]': maskLayers('left'),
		'&[data-scroll-mask-end="right"]': maskLayers('right'),
		'&[data-scroll-mask-end="top"]': maskLayers('top'),
	},
});

/** Private overflowing styles for `axis="block"`. */
export const scrollMaskOverflowingBlock = style({
	...overflowingFadeVars,
	...overflowingMask('scroll(self block)'),
	selectors: {
		'&[data-scroll-mask-end="bottom"]': maskLayers('bottom'),
		'&[data-scroll-mask-end="left"]': maskLayers('left'),
		'&[data-scroll-mask-end="right"]': maskLayers('right'),
		'&[data-scroll-mask-end="top"]': maskLayers('top'),
	},
});
